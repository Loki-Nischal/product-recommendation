import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
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
  // Fetch Products (stable identity)
  // ---------------------------
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/products");
      console.log("Response from /products:", res);

      // API wrapper returns response.data directly
      // Backend returns: { success: true, products: [...] }
      const productsData = res?.products || [];
      console.log("Products from response:", productsData);

      // Ensure it's always an array
      const productsArray = Array.isArray(productsData) ? productsData : [];
      console.log("Final products array:", productsArray);

      setProducts(productsArray);
    } catch (err) {
      console.error("Error fetching products:", err);
      setError(err.message || "Failed to fetch products");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // ---------------------------
  // Add Product
  // ---------------------------
  const addProduct = useCallback(async (productData) => {
    setError(null);

    try {
      const res = await api.post("/products", productData);

      // Response is { success: true, product: {...} }
      const newProduct = res?.product || res?.data?.product || res;

      setProducts((prev) => {
        const prevSafe = Array.isArray(prev) ? prev : [];
        // Ensure newProduct is an object before adding
        if (newProduct && typeof newProduct === 'object') {
          return [...prevSafe, newProduct];
        }
        return prevSafe;
      });

      return newProduct;
    } catch (err) {
      const msg = err.message || "Failed to add product";
      setError(msg);
      throw err;
    }
  }, []);

  // ---------------------------
  // Delete Product
  // ---------------------------
  const deleteProduct = useCallback(async (productId) => {
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
  }, []);

  // ---------------------------
  // Update Product
  // ---------------------------
  const updateProduct = useCallback(async (productId, updates) => {
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
  }, []);

  const value = useMemo(() => ({
    products,
    loading,
    error,
    fetchProducts,
    addProduct,
    deleteProduct,
    updateProduct,
  }), [products, loading, error, fetchProducts, addProduct, deleteProduct, updateProduct]);

  return (
    <AdminProductContext.Provider value={value}>
      {children}
    </AdminProductContext.Provider>
  );
};

export const useAdminProducts = () => useContext(AdminProductContext);
