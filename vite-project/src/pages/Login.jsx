import React, { useState, useContext } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import API from "../api/api";
import { AuthContext } from "../context/AuthContext";

const schema = Yup.object({
  email: Yup.string().required("Email is required").email("Enter a valid email"),
  password: Yup.string().required("Password is required").min(6, "Minimum 6 characters"),
});

const Login = () => {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: yupResolver(schema) });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const res = await API.post("/users/login", data);
      // Our API client returns `response.data` directly via interceptor,
      // but some callers may still return the full response object.
      const payload = res?.data ?? res;
      const token = payload?.token;
      const user = payload?.user;

      if (!token || !user) {
        // Defensive: avoid throwing raw values that break UI. Provide clear message.
        throw new Error(payload?.message || "Invalid login response from server");
      }

      const ok = login(token, user);
      if (ok === false) {
        alert("Login failed: token mismatch. Please try again.");
        return;
      }

      navigate(user.role === "admin" ? "/admin/dashboard" : "/profile");
    } catch (err) {
      console.error("LOGIN ERROR:", err);
      // Normalize different error shapes (string, Error, or server payload)
      const errMsg =
        (typeof err === 'string' && err) ||
        err?.message ||
        err?.msg ||
        err?.error ||
        (err && typeof err === 'object' ? JSON.stringify(err) : null) ||
        '❌ Login failed';

      alert(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white shadow-xl rounded-2xl w-full max-w-md p-8">
        <h2 className="text-3xl font-bold text-center mb-6 text-slate-800">Login</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div>
            <input
              type="email"
              {...register("email")}
              placeholder="Email"
              className={`border p-3 rounded-lg w-full ${errors.email ? "border-red-500" : ""}`}
            />
            {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
          </div>

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              {...register("password")}
              placeholder="Password"
              className={`border p-3 rounded-lg w-full ${errors.password ? "border-red-500" : ""}`}
            />
            <span onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 cursor-pointer text-gray-500">
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </span>
            {errors.password && <p className="text-red-500 text-sm">{errors.password.message}</p>}
          </div>

          <button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg font-semibold">
            {loading ? "Logging in..." : "Login"}
          </button>
          <div className="mt-3 text-center">
            <button
              type="button"
              onClick={() => navigate("/admin/login")}
              className="text-sm text-blue-600 hover:underline"
            >
              Login as Admin
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
