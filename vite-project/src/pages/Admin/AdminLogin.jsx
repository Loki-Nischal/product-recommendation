import { useState } from "react";
import { useAdmin } from "../../context/AdminAuthContext";
import { useNavigate } from "react-router-dom";
import API from "../../api/api";

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

const ADMIN_TOKEN_KEY = 'adminToken';
const ADMIN_USER_KEY = 'adminUser';

const AdminLogin = () => {
  const { login, registerAdminSession } = useAdmin();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await API.post('/admin/login', { email: form.email, password: form.password });
      const token = res?.token;
      const user = res?.user;
      if (!token || !user || user.role !== 'admin') {
        setError('Invalid admin credentials');
        return;
      }

      // Persist admin auth in DEDICATED keys only (never in shared token/user)
      localStorage.setItem(ADMIN_TOKEN_KEY, token);
      localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(user));

      // Register admin session in context (schedules auto-logout)
      const payload = parseJwt(token);
      const expiry = payload?.exp ? payload.exp * 1000 : Date.now() + 8 * 3600 * 1000;
      const adminData = { email: user.email, expiry, token };
      registerAdminSession(adminData);

      // navigate after storing
      navigate('/admin/dashboard');
    } catch (err) {
      console.error('Admin login failed', err);
      setError(err?.message || 'Login failed');
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 shadow-lg rounded-xl w-96"
      >
        <h2 className="text-2xl font-bold text-center mb-6">Admin Login</h2>

        {error && <p className="text-red-500 text-center mb-3">{error}</p>}

        <input
          type="email"
          placeholder="Admin Email"
          className="w-full border p-3 rounded-lg mb-4"
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full border p-3 rounded-lg mb-4"
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />

        <button className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700">
          Login
        </button>
      </form>
    </div>
  );
};

export default AdminLogin;
