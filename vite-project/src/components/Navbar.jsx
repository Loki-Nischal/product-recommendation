import React, { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext"; // import context

const Navbar = () => {
  const navigate = useNavigate();
  const { isLoggedIn, logout } = useContext(AuthContext); // use context

  const handleLogout = () => {
    logout(); // this updates context state
    navigate("/login");
  };

  return (
    <nav className="bg-slate-800 text-white px-6 py-3 shadow-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center cursor-pointer">
          <img
            src="/image/images.jpeg"
            alt="Logo"
            className="h-10 w-10 object-cover mr-2 rounded-full"
          />
          <span className="text-2xl font-bold">MyStore</span>
        </Link>

        {/* Navigation Links */}
        <ul className="hidden md:flex space-x-8 text-slate-200">
          <li>
            <Link to="/" className="hover:text-white">Home</Link>
          </li>
          <li>
            <Link to="/about" className="hover:text-white">About</Link>
          </li>
          <li className="hover:text-white cursor-pointer">Services</li>
          <li className="hover:text-white cursor-pointer">Contact</li>
        </ul>

        {/* Auth Buttons */}
        <div className="space-x-3">
          {!isLoggedIn ? (
            <>
              <button
                onClick={() => navigate("/login")}
                className="px-4 py-2 rounded-lg border border-slate-400 hover:bg-slate-700 transition-colors"
              >
                Login
              </button>
              <button
                onClick={() => navigate("/register")}
                className="px-4 py-2 rounded-lg bg-slate-600 hover:bg-slate-700 transition-colors"
              >
                Register
              </button>
            </>
          ) : (
            <button
              onClick={handleLogout}
              className="border px-4 py-2 rounded-lg bg-slate-800 hover:bg-black-700 transition-colors"
            >
              Logout
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
