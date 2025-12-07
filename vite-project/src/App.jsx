import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProductDetails from "./pages/ProductDetails";
import PrivateRoute from "./components/PrivateRoute";
import RecommendationSystem from "./pages/RecommendationSystem";
import { AuthProvider } from "./context/AuthContext";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminRoute from "./components/AdminRoute";

const App = () => {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />  
            
            {/* Protected Routes */}
            <Route
              path="/recommendations"
              element={
                <PrivateRoute>
                  <RecommendationSystem />
                </PrivateRoute>
              }
            />
            <Route
              path="/productdetails/:id"
              element={
                <PrivateRoute>
                  <ProductDetails />
                </PrivateRoute>
              }
            />

            <Route
              path="/admin/dashboard"
              element={
             <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
             }
           />

            
            
            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </AuthProvider>
  );
};

export default App;