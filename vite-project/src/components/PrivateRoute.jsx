import React from "react";
import { Navigate } from "react-router-dom";

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem("token"); // check if user is logged in

  if (!token) {
    // not logged in → redirect to login
    return <Navigate to="/login" replace />;
  }

  // logged in → render the page
  return children;
};

export default PrivateRoute;
