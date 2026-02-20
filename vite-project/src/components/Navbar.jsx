import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ShoppingCart } from 'lucide-react';
import api from '../api/api';

const Navbar = () => {
  const navigate = useNavigate();
  const { isLoggedIn, logout, user } = useAuth();
  const [cartCount, setCartCount] = useState(0);
  const [cartBump, setCartBump] = useState(false);
  const bumpTimerRef = React.useRef(null);
  const [scrolled, setScrolled] = useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 6);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await api.get('/user/profile');
        if (mounted && res && res.success && res.data) {
          const items = Array.isArray(res.data.cartProducts) ? res.data.cartProducts : [];
          setCartCount(items.length);
        }
      } catch (err) {
        // ignore
      }
    };
    load();

    const onCartUpdated = (e) => {
      try {
        const c = e?.detail?.count;
        if (typeof c === 'number') setCartCount(c);
        else if (e?.detail?.delta) setCartCount(prev => Math.max(0, prev + e.detail.delta));
        // trigger bump animation when cart changes
        try {
          if (bumpTimerRef.current) clearTimeout(bumpTimerRef.current);
          setCartBump(true);
          bumpTimerRef.current = setTimeout(() => setCartBump(false), 600);
        } catch (err) {}
      } catch (err) {}
    };

    window.addEventListener('cart-updated', onCartUpdated);
    return () => { mounted = false; window.removeEventListener('cart-updated', onCartUpdated); };
  }, []);

  return (
    <nav className={`bg-white/95 backdrop-blur-sm border-b text-gray-800 sticky top-0 z-50 transition-shadow ${scrolled ? 'shadow-md' : ''}`}>
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center cursor-pointer">
          <img
            src="/image/images.jpeg"
            alt="Logo"
            className="h-10 w-10 object-cover mr-3 rounded-full"
          />
          <span className="text-xl font-extrabold text-gray-900">MyStore</span>
        </Link>

        {/* Navigation Links */}
        <ul className="hidden md:flex space-x-6 text-gray-700">
          <li>
            <Link to="/" className="hover:text-blue-600">Home</Link>
          </li>
          <li>
            <Link to="/recommendations" className="hover:text-blue-600">Recommendations</Link>
          </li>
          {isLoggedIn && (
            <li>
              <Link to="/profile" className="hover:text-blue-600">Profile</Link>
            </li>
          )}
          <li className="hover:text-blue-600 cursor-pointer">Services</li>
          <li>
            <Link to="/contact" className="hover:text-blue-600">Contact</Link>
          </li>
        </ul>

        {/* Auth Buttons */}
        <div className="space-x-3 flex items-center">
          {!isLoggedIn ? (
            <>
              <div className="inline-flex items-center space-x-2">
                <button
                  onClick={() => navigate("/login")}
                  className="px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-sm"
                >
                  Login
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/admin/login")}
                  className="px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-sm"
                >
                  Admin Login
                </button>
              </div>

              <button
                onClick={() => navigate("/register")}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
              >
                Register
              </button>
            </>
          ) : (
            <div className="flex items-center gap-3">
              {/* Cart Icon with badge */}
              <button onClick={() => navigate('/cart')} className="relative p-2 rounded hover:bg-gray-50">
                <div className="text-gray-700"><ShoppingCart size={20} /></div>
                {cartCount > 0 && (
                  <span className={`absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full px-2 py-0.5 transform transition-all duration-300 ${cartBump ? 'scale-125 shadow-lg' : 'scale-100'}`}>
                    {cartCount}
                  </span>
                )}
              </button>
              {user?.name && (
                <button onClick={() => navigate('/profile')} className="text-sm px-3 py-2 rounded hover:bg-gray-50">
                  {user.name}
                </button>
              )}
              <button
                onClick={handleLogout}
                className="border px-4 py-2 rounded-lg bg-white hover:bg-gray-50 transition-colors text-sm"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;