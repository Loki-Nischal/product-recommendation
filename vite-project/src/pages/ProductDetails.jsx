import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import api from "../api/api";
import { Loader } from "lucide-react";

const ProductDetails = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await api.get("/products");
        // Response is { success: true, products: [...] }
        const fetchedProducts = response.products || [];
        const productsArray = Array.isArray(fetchedProducts) ? fetchedProducts : [];
        
        setAllProducts(productsArray);

        // Find the product by ID (handle both MongoDB ObjectId and regular id)
        const foundProduct = productsArray.find(
          (p) => (p._id && p._id.toString() === id) || (p.id && p.id.toString() === id)
        );

        if (foundProduct) {
          setProduct(foundProduct);
        } else {
          setError("Product not found");
        }
      } catch (err) {
        console.error("Error fetching product:", err);
        setError("Failed to load product details");
      } finally {
        setLoading(false);
      }
    };    fetchProducts();
  }, [id]);

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
            disabled={product.stock === 0}
            className={`px-6 py-3 rounded-lg w-full md:w-auto transition ${
              product.stock > 0 
                ? "bg-blue-600 text-white hover:bg-blue-700" 
                : "bg-gray-400 text-white cursor-not-allowed"
            }`}
          >
            {product.stock > 0 ? "Add to Cart" : "Out of Stock"}
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

      {/* RELATED PRODUCTS */}
      {allProducts.length > 1 && (
        <div className="mt-14">
          <h2 className="text-2xl font-bold mb-6">You May Also Like</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {allProducts
              .filter((p) => (p._id || p.id) !== (product._id || product.id))
              .slice(0, 4)
              .map((related) => (
                <a
                  href={`/product/${related._id || related.id}`}
                  key={related._id || related.id}
                  className="border rounded-lg shadow hover:shadow-lg transition p-3"
                >
                  <img
                    src={related.image || related.img || "https://via.placeholder.com/300"}
                    className="w-full h-40 object-cover rounded"
                  />
                  <h3 className="font-semibold mt-3">{related.title || related.name}</h3>
                  <p className="text-red-600 font-bold">$ {related.price}</p>
                </a>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetails;
