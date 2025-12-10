import { Navigate } from "react-router-dom";
import { useAdmin } from "../context/AdminAuthContext";

const AdminRoutes = ({ children }) => {
  const { admin } = useAdmin();

  if (admin === undefined) {
    return null; // prevents early render error
  }

  return admin ? children : <Navigate to="/admin/login" replace />;
};

export default AdminRoutes;
