import { Navigate } from "react-router-dom";
import { useAdmin } from "../context/AdminAuthContext";

const AdminRoutes = ({ children }) => {
  const { isAuthenticated } = useAdmin();

  // Synchronous check — if not authenticated redirect to login
  return isAuthenticated ? children : <Navigate to="/admin/login" replace />;
};

export default AdminRoutes;
