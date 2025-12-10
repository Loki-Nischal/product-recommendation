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
import AdminLogin from "./pages/Admin/AdminLogin";
import Dashboard from "./pages/Admin/Dashboard";
import Products from "./pages/Admin/Products";
import AddProduct from "./pages/Admin/AddProduct";
import AdminRoute from "./routes/AdminRoutes";
import AdminDashboard from "./pages/AdminDashboard";


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
              path="/admin/products"
              element={
              <AdminRoute><Products /></AdminRoute>
             }
            />

            <Route 
              path="/admin/add-product"
              element={
              <AdminRoute><AddProduct /></AdminRoute>
             }
            /> 

            <Route
              path="/admin/dashboard"
              element={
             <AdminRoute>
              <Dashboard />
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