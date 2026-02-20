import { createContext, useContext, useState, useEffect } from "react";
import API from "../api/api";
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";

export const AuthContext = createContext();

// ── helpers ──────────────────────────────────────────────
const decodeJwt = (token) => {
  try {
    const [, payload] = token.split(".");
    if (!payload) return null;
    return JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return null;
  }
};

/** Move a stale admin JWT out of the user `token` key into `adminToken`. */
const migrateStaleAdminToken = () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) return;
    const payload = decodeJwt(token);
    if (payload?.role === "admin") {
      localStorage.setItem("adminToken", token);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
  } catch { /* ignore */ }
};

/** Returns true when the JWT `id` matches the stored user's _id. */
const tokenMatchesUser = (token, storedUser) => {
  try {
    const payload = decodeJwt(token);
    if (!payload?.id) return false;
    const userId = storedUser?._id || storedUser?.id;
    return payload.id === userId;
  } catch {
    return false;
  }
};

// ── provider ─────────────────────────────────────────────
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  const clearSession = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    try {
      localStorage.removeItem("likedProductIds");
      localStorage.removeItem("viewedProductIds");
    } catch { /* ignore */ }
    setUser(null);
  };

  // ── background profile sync (uses fetch to avoid axios 401 handler) ──
  const syncProfileCache = async () => {
    try {
      const tk = localStorage.getItem("token");
      if (!tk) return;
      const r = await fetch(`${API_BASE}/user/profile`, {
        method: "GET",
        headers: { Authorization: `Bearer ${tk}`, "Content-Type": "application/json" },
      });
      if (r.status !== 200) return;
      const res = await r.json();
      if (res?.success && res.data) {
        const liked = Array.isArray(res.data.likedProducts)
          ? res.data.likedProducts.map((p) => p._id || p.id).filter(Boolean)
          : [];
        const viewed = Array.isArray(res.data.viewedProducts)
          ? res.data.viewedProducts.map((p) => p._id || p.id).filter(Boolean)
          : [];
        try {
          localStorage.setItem("likedProductIds", JSON.stringify(liked));
          localStorage.setItem("viewedProductIds", JSON.stringify(viewed));
        } catch { /* ignore */ }
      }
    } catch { /* ignore background errors */ }
  };

  // ── initialise on mount ────────────────────────────────
  useEffect(() => {
    // 1. Move any stale admin JWT out of user keys
    migrateStaleAdminToken();

    const token = localStorage.getItem("token");
    const storedUserRaw = localStorage.getItem("user");

    if (token && storedUserRaw) {
      let parsedUser;
      try {
        parsedUser = JSON.parse(storedUserRaw);
      } catch {
        clearSession();
        setIsAuthReady(true);
        return;
      }

      // 2. Guard against legacy mixed session (admin role in user keys)
      if (parsedUser?.role === "admin") {
        clearSession();
        setIsAuthReady(true);
        return;
      }

      // 3. Verify the JWT belongs to this user
      if (!tokenMatchesUser(token, parsedUser)) {
        console.warn("Token/user mismatch – clearing session");
        clearSession();
        setIsAuthReady(true);
        return;
      }

      // 4. Check token expiry
      const payload = decodeJwt(token);
      if (payload?.exp && payload.exp * 1000 <= Date.now()) {
        clearSession();
        setIsAuthReady(true);
        return;
      }

      // ✓ Valid user session
      setUser(parsedUser);
      syncProfileCache(); // fire-and-forget
    } else {
      // No token or no user → make sure nothing stale remains
      if (token || storedUserRaw) clearSession();
    }

    setIsAuthReady(true);

    // Cross-tab sync
    const onStorage = (e) => {
      if (e.key === "token" || e.key === "user") {
        const raw = localStorage.getItem("user");
        if (raw) {
          try { setUser(JSON.parse(raw)); } catch { clearSession(); }
        } else {
          setUser(null);
        }
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // ── login ──────────────────────────────────────────────
  const login = (token, userData) => {
    // Verify the token really belongs to this user
    const payload = decodeJwt(token);
    const userId = userData?._id || userData?.id;
    if (payload?.id && userId && payload.id !== userId) {
      console.error("Login token does not match user – aborting");
      return false;
    }

    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);

    // background sync
    syncProfileCache();
    return true;
  };

  const logout = () => {
    clearSession();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthReady,
        isLoggedIn: !!user,
        isAdmin: user?.role === "admin",
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
