import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import API from "../api/api";

const ProductDetails = () => {
  const { id } = useParams();

  const [product, setProduct] = useState(null);
  const [recommended, setRecommended] = useState([]);

  // Fetch product details
  const fetchProduct = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await API.get(`/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProduct(res.data);
    } catch (error) {
      console.error("Error loading product:", error);
    }
  };

  // Fetch AI Recommendations
  const fetchRecommendations = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await API.get(`/recommend/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setRecommended(res.data);
    } catch (error) {
      console.error("Error fetching recommendations:", error);
    }
  };

  useEffect(() => {
    fetchProduct();
    fetchRecommendations();
  }, [id]);

  if (!product) return <h2 className="text-center mt-10">Loading...</h2>;

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="container mx-auto px-6">

        {/* PRODUCT DETAILS CARD */}
        <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-3xl mx-auto">
          <img
            src={product.image}
            alt={product.title}
            className="w-full h-64 object-cover rounded-lg"
          />

          <h1 className="text-3xl font-semibold mt-4">{product.title}</h1>
          <p className="text-gray-600 mt-2">{product.description}</p>

          <p className="text-lg font-bold mt-4 text-blue-600">
            ${product.price}
          </p>

          <p className="mt-2 text-sm text-gray-500">
            Category: {product.category}
          </p>
        </div>

        {/* RECOMMENDATIONS SECTION */}
        <h2 className="text-2xl font-bold mt-10 mb-4 text-slate-800">
          Recommended For You
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">

          {recommended.length === 0 ? (
            <p>No recommendations available yet...</p>
          ) : (
            recommended.map((item) => (
              <div
                key={item._id}
                className="bg-white p-4 shadow-md rounded-xl hover:shadow-xl transition cursor-pointer"
              >
                <img
                  src={item.image}
                  alt={item.title}
                  className="h-40 w-full object-cover rounded-md"
                />
                <h3 className="font-semibold mt-3 text-lg">{item.title}</h3>
                <p className="text-gray-500 text-sm">{item.category}</p>
                <p className="font-bold text-blue-600 mt-1">${item.price}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
