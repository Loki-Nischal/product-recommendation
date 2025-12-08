import { Navigate } from "react-router-dom";
import { useAdmin } from "../context/AdminAuthContext";

const AdminRoutes = ({ children }) => {
  const { admin } = useAdmin();

  if (!admin) return <Navigate to="/admin/login" replace />;

  return children;
};

export default AdminRoutes;
