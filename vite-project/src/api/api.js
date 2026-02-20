import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api",
});

const USER_TOKEN_KEY = "token";
const USER_KEY = "user";
const ADMIN_TOKEN_KEY = "adminToken";
const ADMIN_USER_KEY = "adminUser";

const isAdminRequest = (url = "") => {
  const normalized = String(url || "").replace(/^\/+/, "");
  // Check if URL starts with admin/ OR contains /admin/
  return normalized.startsWith("admin/") || normalized.includes("/admin/");
};

// Attach correct token to every request
API.interceptors.request.use((config) => {
  const token = isAdminRequest(config?.url)
    ? localStorage.getItem(ADMIN_TOKEN_KEY)
    : localStorage.getItem(USER_TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle response - return data directly
API.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    try {
      const status = error.response?.status;
      const payload = error.response?.data;
      console.error('API Error:', {
        message: error.message,
        status,
        data: payload,
        config: error.config,
      });

      const message = payload?.message || payload?.error || error.message || 'API Error';

      if (status === 401) {
        try {
          const adminReq = isAdminRequest(error?.config?.url);
          if (adminReq) {
            localStorage.removeItem(ADMIN_TOKEN_KEY);
            localStorage.removeItem(ADMIN_USER_KEY);
            localStorage.removeItem('admin');
            window.location.href = '/admin/login';
          } else {
            localStorage.removeItem(USER_TOKEN_KEY);
            localStorage.removeItem(USER_KEY);
            window.location.href = '/login';
          }
        } catch (e) {
          // ignore
        }
      }

      return Promise.reject({ message, status, data: payload });
    } catch (logErr) {
      console.error('API Error (logging failed):', logErr, error);
      return Promise.reject({ message: error.message || 'API Error' });
    }
  }
);

export default API;
