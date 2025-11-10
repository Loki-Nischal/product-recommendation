import React, { useState, useContext } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import API from "../api/api";
import { AuthContext } from "../context/AuthContext"; // import context

// Validation schema
const schema = Yup.object({
  email: Yup.string()
    .required("Email is required")
    .email("Enter a valid email address"),
  password: Yup.string()
    .required("Password is required")
    .matches(/^[A-Z]/, "Password must start with a capital letter")
    .matches(/\d/, "Password must contain at least one number")
    .min(6, "Password must be at least 6 characters"),
});

const Login = () => {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext); // get login function
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: yupResolver(schema) });

  const onSubmit = async (data) => {
    try {
      const res = await API.post("/users/login", data);
      alert("✅ Login successful!");

      // Update context state immediately
      login(res.data.token); // this sets isLoggedIn = true

      navigate("/productdetails"); // redirect to product details
    } catch (err) {
      console.error(err);
      alert("❌ Invalid credentials!");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white shadow-lg rounded-2xl w-full max-w-md p-8">
        <h2 className="text-3xl font-bold text-center text-slate-800 mb-6">
          Login
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {/* Email */}
          <div>
            <input
              type="email"
              {...register("email")}
              placeholder="Email"
              className={`border p-3 rounded-lg w-full outline-none focus:ring-2 ${
                errors.email ? "border-red-500 focus:ring-red-400" : "focus:ring-blue-500"
              }`}
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              {...register("password")}
              placeholder="Password"
              className={`border p-3 rounded-lg w-full outline-none focus:ring-2 ${
                errors.password ? "border-red-500 focus:ring-red-400" : "focus:ring-blue-500"
              }`}
            />
            <span
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 cursor-pointer text-gray-500 hover:text-gray-700"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </span>
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg font-semibold transition-all duration-200"
          >
            Login
          </button>

          <p className="text-center text-sm text-gray-500 mt-3">
            Don’t have an account?{" "}
            <a href="/register" className="text-blue-600 hover:text-blue-800 font-medium">
              Register here
            </a>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
