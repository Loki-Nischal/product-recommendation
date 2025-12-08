import { useState } from "react";
import { useAdmin } from "../../context/AdminAuthContext";
import { useNavigate } from "react-router-dom";

const AdminLogin = () => {
  const { login } = useAdmin();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const success = login(form.email, form.password);
    if (success) navigate("/admin/dashboard");
    else setError("Invalid admin credentials");
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
