import { createContext, useContext, useState, useEffect } from "react";
import api from "../api/api";

const AdminProductContext = createContext();

export const AdminProductProvider = ({ children }) => {
  const [products, setProducts] = useState([]); // always an array
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  // ---------------------------
  // SAFE EXTRACTOR (prevents errors)
  // ---------------------------
  const safeArray = (val) => {
    if (Array.isArray(val)) return val;
    return []; // fallback
  };

  // ---------------------------
  // Fetch Products
  // ---------------------------
  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/products");

      // Accepts ANY backend format
      const finalProducts =
        safeArray(res?.products) ||
        safeArray(res?.data?.products) ||
        safeArray(res);

      setProducts(finalProducts);
    } catch (err) {
      console.error("Error fetching products:", err);
      setError(err.message || "Failed to fetch products");
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------
  // Add Product
  // ---------------------------
  const addProduct = async (productData) => {
    setError(null);

    try {
      const res = await api.post("/products", productData);

      const newProduct = res?.product || res?.data?.product || res;

      setProducts((prev) => {
        const prevSafe = Array.isArray(prev) ? prev : [];
        return [...prevSafe, newProduct];
      });

      return newProduct;
    } catch (err) {
      const msg = err.message || "Failed to add product";
      setError(msg);
      throw err;
    }
  };

  // ---------------------------
  // Delete Product
  // ---------------------------
  const deleteProduct = async (productId) => {
    setError(null);
    try {
      await api.delete(`/products/${productId}`);

      setProducts((prev) => {
        const prevSafe = Array.isArray(prev) ? prev : [];
        return prevSafe.filter(
          (p) => p._id !== productId && p.id !== productId
        );
      });
    } catch (err) {
      const msg = err.message || "Failed to delete product";
      setError(msg);
      throw err;
    }
  };

  // ---------------------------
  // Update Product
  // ---------------------------
  const updateProduct = async (productId, updates) => {
    setError(null);
    try {
      const res = await api.put(`/products/${productId}`, updates);

      const updatedProduct = res?.product || res?.data?.product || res;

      setProducts((prev) => {
        const prevSafe = Array.isArray(prev) ? prev : [];
        return prevSafe.map((p) =>
          p._id === productId || p.id === productId ? updatedProduct : p
        );
      });

      return updatedProduct;
    } catch (err) {
      const msg = err.message || "Failed to update product";
      setError(msg);
      throw err;
    }
  };

  return (
    <AdminProductContext.Provider
      value={{
        products,
        loading,
        error,
        fetchProducts,
        addProduct,
        deleteProduct,
        updateProduct,
      }}
    >
      {children}
    </AdminProductContext.Provider>
  );
};

export const useAdminProducts = () => useContext(AdminProductContext);
