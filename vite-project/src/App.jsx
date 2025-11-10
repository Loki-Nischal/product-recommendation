import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProductDetails from "./pages/ProductDetails";
import PrivateRoute from "./components/PrivateRoute";
import { AuthProvider } from "./context/AuthContext"; // Fixed import

// Temporary component
const TemporaryRecommendationSystem = () => (
  <div className="min-h-screen bg-gray-50 py-8">
    <div className="container mx-auto px-4">
      <h1 className="text-3xl font-bold text-center mb-8">Product Recommendations</h1>
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <p className="text-gray-600">Recommendation system coming soon...</p>
      </div>
    </div>
  </div>
);

const App = () => {
  return (
    <AuthProvider> {/* Wrap with AuthProvider */}
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Protected Routes */}
            <Route
              path="/recommendations"
              element={
                <PrivateRoute>
                  <TemporaryRecommendationSystem />
                </PrivateRoute>
              }
            />
            <Route
              path="/product/:id"
              element={
                <PrivateRoute>
                  <ProductDetails />
                </PrivateRoute>
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