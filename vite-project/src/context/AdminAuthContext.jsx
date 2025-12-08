import { createContext, useContext, useState } from "react";

const AdminAuthContext = createContext();

export const AdminAuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(
    JSON.parse(localStorage.getItem("admin")) || null
  );

  const login = (email, password) => {
    if (email === "admin@example.com" && password === "admin123") {
      const adminData = { email };
      localStorage.setItem("admin", JSON.stringify(adminData));
      setAdmin(adminData);
      return true;
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem("admin");
    setAdmin(null);
  };

  return (
    <AdminAuthContext.Provider value={{ admin, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdmin = () => useContext(AdminAuthContext);
export default AdminAuthContext;
