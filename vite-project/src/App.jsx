import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import AdminHeader from "./components/Admin/AdminHeader";
import { AdminAuthProvider, useAdmin } from "./context/AdminAuthContext";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProductDetails from "./pages/ProductDetails";
import ProfilePage from "./pages/ProfilePage";
import PrivateRoute from "./components/PrivateRoute";
import RecommendationSystem from "./pages/RecommendationSystem";
import CartPage from "./pages/Cart";
import CheckoutPage from "./pages/Checkout";
import OrderDetailsPage from "./pages/OrderDetails";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentFailure from "./pages/PaymentFailure";
import { AuthProvider } from "./context/AuthContext";
import AdminLogin from "./pages/Admin/AdminLogin";
import Dashboard from "./pages/Admin/Dashboard";
import Products from "./pages/Admin/Products";
import Orders from "./pages/Admin/Orders";
import AddProduct from "./pages/Admin/AddProduct";
import EditProduct from "./pages/Admin/EditProduct";
import AdminUsers from "./pages/Admin/Users";
import AdminRoute from "./routes/AdminRoutes";
import ChatBot from "./components/ChatBot";
import ProfileSaveToast from "./components/ProfileSaveToast";
import ContactPage from "./pages/Contact";

const App = () => {
  return (
    <AdminAuthProvider>
      <AuthProvider>
        <div className="min-h-screen bg-gray-50">
          <HeaderSelector />
          <main>
            <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/product/:id" element={<ProductDetails />} />

          {/* Protected User Routes */}
          <Route
            path="/recommendations"
            element={
              <PrivateRoute>
                <RecommendationSystem />
              </PrivateRoute>
            }
          />
          <Route
            path="/cart"
            element={
              <PrivateRoute>
                <CartPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/checkout"
            element={
              <PrivateRoute>
                <CheckoutPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/order/:id"
            element={
              <PrivateRoute>
                <OrderDetailsPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/payment/success"
            element={
              <PrivateRoute>
                <PaymentSuccess />
              </PrivateRoute>
            }
          />
          <Route
            path="/payment/failure"
            element={
              <PrivateRoute>
                <PaymentFailure />
              </PrivateRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <ProfilePage />
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

          {/* Protected Admin Routes */}
          <Route 
            path="/admin/dashboard"
            element={
              <AdminRoute>
                <Dashboard />
              </AdminRoute>
            }
          />

          <Route 
            path="/admin/products"
            element={
              <AdminRoute>
                <Products />
              </AdminRoute>
            }
          />

          <Route 
            path="/admin/orders"
            element={
              <AdminRoute>
                <Orders />
              </AdminRoute>
            }
          />

          <Route 
            path="/admin/users"
            element={
              <AdminRoute>
                <AdminUsers />
              </AdminRoute>
            }
          />

          <Route 
            path="/admin/add-product"
            element={
              <AdminRoute>
                <AddProduct />
              </AdminRoute>
            }
          />

          <Route 
            path="/admin/edit-product/:id"
            element={
              <AdminRoute>
                <EditProduct />
              </AdminRoute>
            }
          />

          {/* Contact */}
          <Route path="/contact" element={<ContactPage />} />

          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        <ChatBot />
        <ProfileSaveToast />
      </div>
      </AuthProvider>
    </AdminAuthProvider>
  );
};

const HeaderSelector = () => {
  const { admin } = useAdmin();
  return admin ? <AdminHeader /> : <Navbar />;
};

export default App;