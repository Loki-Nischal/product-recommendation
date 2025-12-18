import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api",
});

// Attach token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle response - return data directly
API.interceptors.response.use(
  (response) => {
    // Return the response data (the actual API response)
    return response.data;
  },
  (error) => {
    // Normalize error shape and handle auth failures globally
    console.error('API Error:', error);

    const status = error.response?.status;
    const payload = error.response?.data;
    const message = payload?.message || payload?.error || error.message || 'API Error';

    // If unauthorized, clear session and force login
    if (status === 401) {
      try {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Redirect to login page to re-authenticate
        window.location.href = '/login';
      } catch (e) {
        // ignore
      }
    }

    return Promise.reject({ message, status, data: payload });
  }
);

export default API;
