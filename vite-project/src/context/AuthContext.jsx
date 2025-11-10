import React, { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // ✅ Check token on first load
  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
  }, []);

  // ✅ Called after successful login
  const login = (token) => {
    localStorage.setItem("token", token);
    setIsLoggedIn(true); // triggers Navbar re-render instantly
  };

  // ✅ Called when user clicks logout
  const logout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false); // updates Navbar instantly
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
