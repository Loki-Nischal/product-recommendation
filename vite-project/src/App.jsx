import React from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProductDetails from "./pages/ProductDetails";
import PrivateRoute from "./components/PrivateRoute"; // import PrivateRoute

const App = () => {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected ProductDetails route */}
        <Route
          path="/productdetails"
          element={
            <PrivateRoute>
              <ProductDetails />
            </PrivateRoute>
          }
        />
      </Routes>
    </>
  );
};

export default App;
