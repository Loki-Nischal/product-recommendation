import { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import API from "../api/api";

const AdminAuthContext = createContext();

const ADMIN_STORAGE_KEY = "admin";
const ADMIN_TOKEN_KEY = "adminToken";
const ADMIN_USER_KEY = "adminUser";
const DEFAULT_TTL_HOURS = 8; // session duration

function readStoredAdmin() {
  try {
    const raw = localStorage.getItem(ADMIN_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.expiry && Date.now() > parsed.expiry) {
      // Expired – remove ALL admin keys
      localStorage.removeItem(ADMIN_STORAGE_KEY);
      localStorage.removeItem(ADMIN_TOKEN_KEY);
      localStorage.removeItem(ADMIN_USER_KEY);
      return null;
    }
    return parsed;
  } catch (e) {
    localStorage.removeItem(ADMIN_STORAGE_KEY);
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(ADMIN_USER_KEY);
    return null;
  }
}

function parseJwt(token) {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json);
  } catch (e) {
    return null;
  }
}

export const AdminAuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(() => {
    const stored = readStoredAdmin();
    if (stored) return stored;

    // Migration: if old shared keys contain admin data, move to dedicated keys
    try {
      const token = localStorage.getItem('token');
      const userRaw = localStorage.getItem('user');
      if (token && userRaw) {
        const user = JSON.parse(userRaw);
        if (user?.role === 'admin') {
          const payload = parseJwt(token);
          const expiry = payload?.exp ? payload.exp * 1000 : Date.now() + DEFAULT_TTL_HOURS * 3600 * 1000;
          const adminData = { email: user.email, expiry, token };
          localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(adminData));
          localStorage.setItem(ADMIN_TOKEN_KEY, token);
          localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(user));
          // Remove from shared keys so they don't pollute user sessions
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          return adminData;
        }
      }
    } catch (e) {
      // ignore
    }

    return null;
  });
  const logoutTimerRef = useRef(null);

  const scheduleAutoLogout = useCallback((expiryTs) => {
    if (!expiryTs) return;
    const ms = expiryTs - Date.now();
    if (ms <= 0) {
      setAdmin(null);
      localStorage.removeItem(ADMIN_STORAGE_KEY);
      localStorage.removeItem(ADMIN_TOKEN_KEY);
      localStorage.removeItem(ADMIN_USER_KEY);
      return;
    }
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
    logoutTimerRef.current = setTimeout(() => {
      setAdmin(null);
      localStorage.removeItem(ADMIN_STORAGE_KEY);
      localStorage.removeItem(ADMIN_TOKEN_KEY);
      localStorage.removeItem(ADMIN_USER_KEY);
    }, ms + 50);
  }, []);

  // Register admin session provided by server (token + expiry)
  const registerAdminSession = useCallback((adminData) => {
    if (!adminData) return false;
    const { email, expiry, token } = adminData;
    const expiryTs = Number(expiry) || (Date.now() + DEFAULT_TTL_HOURS * 60 * 60 * 1000);
    const data = { email, expiry: expiryTs, token };
    try {
      localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(data));
      setAdmin(data);
      scheduleAutoLogout(expiryTs);
      return true;
    } catch (e) {
      return false;
    }
  }, [scheduleAutoLogout]);

  useEffect(() => {
    const stored = readStoredAdmin();
    if (stored?.expiry) scheduleAutoLogout(stored.expiry);

    // Cross-tab sync: only react to admin key changes
    const onStorage = (e) => {
      if (e.key === ADMIN_STORAGE_KEY || e.key === ADMIN_TOKEN_KEY) {
        if (!e.newValue) {
          // Admin logged out on another tab
          if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
          setAdmin(null);
        } else if (e.key === ADMIN_STORAGE_KEY) {
          try {
            setAdmin(JSON.parse(e.newValue));
          } catch {
            setAdmin(null);
          }
        }
      }
    };

    window.addEventListener("storage", onStorage);

    return () => {
      if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
      window.removeEventListener("storage", onStorage);
    };
  }, [scheduleAutoLogout]);

  const login = useCallback(async (email, password) => {
    try {
      const res = await API.post('/admin/login', { email, password });
      const token = res?.token;
      const user = res?.user;
      if (!token || !user || user.role !== 'admin') {
        return { success: false, message: 'Invalid admin credentials' };
      }

      // Persist admin auth in DEDICATED keys only
      localStorage.setItem(ADMIN_TOKEN_KEY, token);
      localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(user));

      // Register admin session
      const payload = parseJwt(token);
      const expiry = payload?.exp ? payload.exp * 1000 : Date.now() + DEFAULT_TTL_HOURS * 3600 * 1000;
      const adminData = { email: user.email, expiry, token };
      registerAdminSession(adminData);

      return { success: true, admin: adminData };
    } catch (err) {
      console.error('Admin login failed', err);
      return { success: false, message: err?.message || 'Login failed' };
    }
  }, [registerAdminSession]);

  const logout = useCallback(() => {
    localStorage.removeItem(ADMIN_STORAGE_KEY);
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(ADMIN_USER_KEY);
    setAdmin(null);
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = null;
    }
  }, []);

  const isAuthenticated = !!admin;

  return (
    <AdminAuthContext.Provider value={{ admin, login, logout, isAuthenticated, registerAdminSession }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdmin = () => useContext(AdminAuthContext);

