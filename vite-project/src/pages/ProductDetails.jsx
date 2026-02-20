import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import api from "../api/api";
import { notifyProfileSaved } from '../utils/profileToast';
import { Loader } from "lucide-react";

const ProductDetails = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [loadingSimilar, setLoadingSimilar] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    let mounted = true;

    const fetchProducts = async () => {
      try {
        if (mounted) setLoading(true);
        // Fetch the single product by ID — this also increments its views counter
        // so the popularity signal in the recommendation engine receives real data.
        const response = await api.get(`/products/${id}`);
        const foundProduct = response.product || null;

        if (!mounted) return;

        if (foundProduct) {
          setProduct(foundProduct);
          setError(null);
        } else {
          setProduct(null);
          setError("Product not found");
        }
      } catch (err) {
        console.error("Error fetching product:", err);
        if (mounted) setError("Failed to load product details");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchProducts();

    const handler = (e) => {
      // if the updated product matches current product id, refresh
      const updated = e?.detail;
      if (!updated) {
        fetchProducts();
        return;
      }

      const updatedId = updated._id || updated.id;
      if (updatedId && (updatedId.toString() === id)) {
        fetchProducts();
      }
    };

    window.addEventListener("products-updated", handler);

    return () => {
      mounted = false;
      window.removeEventListener("products-updated", handler);
    };
  }, [id]);

  // record view for authenticated users when product is loaded
  useEffect(() => {
    let mounted = true;
    const recordView = async () => {
      try {
        if (!product) return;
        const token = localStorage.getItem("token");
        if (!token) {
          // guest user: persist viewed product ids in localStorage for personalization
          try {
            const key = 'guestViewedProducts';
            const existing = JSON.parse(localStorage.getItem(key) || '[]');
            const id = (product._id || product.id || '').toString();
            const dedup = [id, ...existing.filter((x) => x !== id)].slice(0, 12);
            localStorage.setItem(key, JSON.stringify(dedup));
          } catch (e) {
            // ignore localStorage errors
          }
          return;
        }

        // logged-in users: call backend to add to user's viewedProducts
        await api.post(`/user/view/${product._id || product.id}`);
        notifyProfileSaved('View saved to profile');
      } catch (err) {
        // non-fatal: log and ignore
        console.debug("Failed to record product view:", err?.message || err);
      }
    };

    if (mounted) recordView();

    return () => {
      mounted = false;
    };
  }, [product]);

  // Fetch content-based similar products using Python TF-IDF
  useEffect(() => {
    let mounted = true;
    
    const fetchSimilarProducts = async () => {
      if (!product) return;
      
      try {
        setLoadingSimilar(true);
        const productId = product._id || product.id;
        const response = await api.get(`/products/similar/${productId}?limit=8`);
        
        if (mounted && response.success && response.products) {
          // Client-side safety net: only keep products with >= 10% similarity
          const qualified = response.products.filter(
            (p) => (p.similarityScore || 0) >= 0.10
          );
          setSimilarProducts(qualified);
        }
      } catch (err) {
        console.debug("Failed to fetch similar products:", err);
        // Fallback: fetch all products and filter by same category client-side
        try {
          const fallbackRes = await api.get("/products");
          const all = fallbackRes.products || [];
          const productId = product._id || product.id;
          const filtered = all.filter(
            (p) => (p._id || p.id) !== productId && p.category === product.category
          );
          if (mounted) setSimilarProducts(filtered.slice(0, 4));
        } catch {
          // silently ignore — similar products are non-critical
        }
      } finally {
        if (mounted) setLoadingSimilar(false);
      }
    };

    fetchSimilarProducts();

    return () => {
      mounted = false;
    };
  }, [product]);

  if (loading) {
    return (
      <div className="p-10 text-center">
        <Loader className="inline-block animate-spin text-blue-500 mb-4" size={40} />
        <p className="text-xl font-semibold text-gray-600">Loading product details...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="p-10 text-center text-xl font-semibold text-red-500">
        {error || "Product not found!"}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-10">
      {/* TOP SECTION */}
      <div className="flex flex-col md:flex-row gap-10">
        {/* LEFT: PRODUCT IMAGE */}
        <div className="md:w-1/2">
          <img
            src={product.image || product.img || "https://via.placeholder.com/500"}
            alt={product.title || product.name}
            className="w-full h-[380px] object-cover rounded-lg shadow"
          />
        </div>

        {/* RIGHT: PRODUCT DETAILS */}
        <div className="md:w-1/2 space-y-5">
          <h1 className="text-3xl font-bold text-gray-900">{product.title || product.name}</h1>

          {/* Rating */}
          <div className="flex items-center gap-2">
            <span className="text-yellow-500 text-xl">⭐</span>
            <span className="text-gray-600">{product.rating || 4} / 5</span>
          </div>

          {/* Price */}
          <div className="flex items-center gap-4">
            <span className="text-4xl font-bold text-red-600">Rs {product.price}</span>
          </div>

          {/* Description */}
          <p className="text-gray-700 text-lg">{product.description || "Product description not available"}</p>

          {/* Stock Info */}
          <div className="text-gray-600">
            <p>Stock: <span className={product.stock > 0 ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
              {product.stock > 0 ? `${product.stock} available` : "Out of stock"}
            </span></p>
          </div>

          {/* Add to Cart */}
          <button 
            disabled={product.stock === 0 || isAdding}
            onClick={async () => {
              if (product.stock === 0 || isAdding) return;
              try {
                setIsAdding(true);
                const token = localStorage.getItem('token');
                if (!token) return window.location.href = '/login';
                await api.post(`/user/cart/${product._id || product.id}`);
                notifyProfileSaved('Added to cart');
                // update global cart badge
                window.dispatchEvent(new CustomEvent('cart-updated', { detail: { delta: 1 } }));
              } catch (err) {
                console.debug('Failed to add to cart:', err);
                alert('Failed to add to cart');
              } finally {
                setIsAdding(false);
              }
            }}
            className={`px-6 py-3 rounded-lg w-full md:w-auto transition ${
              product.stock > 0 
                ? isAdding ? 'bg-blue-400 text-white cursor-wait' : 'bg-blue-600 text-white hover:bg-blue-700' 
                : 'bg-gray-400 text-white cursor-not-allowed'
            }`}
          >
            {isAdding ? (
              <span className="inline-flex items-center gap-2">
                <div className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Adding…
              </span>
            ) : (
              product.stock > 0 ? "Add to Cart" : "Out of Stock"
            )}
          </button>
        </div>
      </div>

      {/* SPECIFICATIONS */}
      {(product.brand || product.category || product.tags) && (
        <div className="mt-14 bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-bold mb-5">Product Details</h2>
          <div className="space-y-3">
            {product.brand && (
              <div className="flex justify-between border-b pb-2">
                <span className="font-medium text-gray-700">Brand</span>
                <span className="text-gray-600">{product.brand}</span>
              </div>
            )}
            {product.category && (
              <div className="flex justify-between border-b pb-2">
                <span className="font-medium text-gray-700">Category</span>
                <span className="text-gray-600">{product.category}</span>
              </div>
            )}
            {product.tags && product.tags.length > 0 && (
              <div className="flex justify-between border-b pb-2">
                <span className="font-medium text-gray-700">Tags</span>
                <span className="text-gray-600">{product.tags.join(", ")}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SIMILAR PRODUCTS - Content-Based Recommendations */}
      {loadingSimilar && (
        <div className="mt-14 text-center py-8">
          <Loader className="inline-block animate-spin text-blue-500" size={32} />
          <p className="text-gray-600 mt-2">Finding similar products...</p>
        </div>
      )}

      {!loadingSimilar && similarProducts.length > 0 && (
        <div className="mt-14">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Similar Products</h2>
            <span className="text-sm text-gray-500">Based on content similarity</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {similarProducts.map((related) => (
                <a
                  href={`/product/${related._id || related.id}`}
                  key={related._id || related.id}
                  className="border rounded-lg shadow hover:shadow-lg transition p-3 group"
                >
                  <div className="relative">
                    <img
                      src={related.image || related.img || "https://via.placeholder.com/300"}
                      className="w-full h-40 object-cover rounded"
                      alt={related.title || related.name}
                    />
                    {related.similarityScore > 0 && (
                      <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                        {Math.round(related.similarityScore * 100)}% match
                      </div>
                    )}
                  </div>
                  <h3 className="font-semibold mt-3 group-hover:text-blue-600 transition line-clamp-2">
                    {related.title || related.name}
                  </h3>
                  <p className="text-sm text-gray-500">{related.category}</p>
                  <p className="text-red-600 font-bold mt-1">Rs {related.price}</p>
                </a>
              ))}
            </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetails;
