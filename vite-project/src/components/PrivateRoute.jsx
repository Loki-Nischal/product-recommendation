import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const PrivateRoute = ({ children }) => {
  const { isLoggedIn, isAuthReady } = useContext(AuthContext);

  if (!isAuthReady) return null;

  return isLoggedIn ? children : <Navigate to="/login" />;
};

export default PrivateRoute;
