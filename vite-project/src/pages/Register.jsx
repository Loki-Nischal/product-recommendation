import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import API from "../api/api";

// ✅ Yup Validation Schema
const validationSchema = Yup.object({
  name: Yup.string()
    .required("Username is required")
    .min(3, "Username must be at least 3 characters long"),
  email: Yup.string()
    .required("Email is required")
    .email("Enter a valid email address"),
  password: Yup.string()
    .required("Password is required")
    .matches(/^[A-Z]/, "Password must start with a capital letter")
    .matches(/\d/, "Password must contain at least one number")
    .min(6, "Password must be at least 6 characters"),
  confirmPassword: Yup.string()
    .required("Please confirm your password")
    .oneOf([Yup.ref("password")], "Passwords must match"),
});

const Register = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // ✅ React Hook Form setup
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(validationSchema),
  });

  // ✅ Handle Submit
  const onSubmit = async (data) => {
    try {
      const res = await API.post("/users/register", {
        name: data.name,
        email: data.email,
        password: data.password,
      });

      alert("🎉 Registration successful!");
      console.log("✅ Response:", res.data);
      navigate("/login"); // 👉 Redirect to login after successful register
    } catch (err) {
      console.error(err);
      alert("❌ Registration failed. Try again!");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white shadow-lg rounded-2xl w-full max-w-md p-8">
        <h2 className="text-3xl font-bold text-center text-slate-800 mb-6">
          Register
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {/* Username */}
          <div>
            <input
              type="text"
              {...register("name")}
              placeholder="Username"
              className={`border p-3 rounded-lg w-full outline-none focus:ring-2 ${
                errors.name ? "border-red-500 focus:ring-red-400" : "focus:ring-blue-500"
              }`}
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>

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

          {/* Confirm Password */}
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              {...register("confirmPassword")}
              placeholder="Confirm Password"
              className={`border p-3 rounded-lg w-full outline-none focus:ring-2 ${
                errors.confirmPassword
                  ? "border-red-500 focus:ring-red-400"
                  : "focus:ring-blue-500"
              }`}
            />
            <span
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-3 cursor-pointer text-gray-500 hover:text-gray-700"
            >
              {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </span>
            {errors.confirmPassword && (
              <p className="text-red-500 text-sm mt-1">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg font-semibold transition-all duration-200"
          >
            Register
          </button>

          {/* Link to Login */}
          <p className="text-center text-sm text-gray-500 mt-3">
            Already have an account?{" "}
            <a
              href="/login"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Login here
            </a>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Register;
