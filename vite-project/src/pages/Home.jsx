import React, { useEffect, useState } from "react";
import API from "../api/api";
import ProductCard from "../components/ProductCard";
import RecommendationList from "../components/RecommendationList";

const Home = () => {
  const [products, setProducts] = useState([]);
  const [recommendations, setRecommendations] = useState([]);

  // Fetch all products
  useEffect(() => {
    API.get("/products")
      .then(res => setProducts(res.data))
      .catch(err => console.error(err));
  }, []);

  // Fetch recommendations (replace userId with a real one)
  useEffect(() => {
    const userId = "replace_with_actual_userId";
    API.get(`/products/recommend/${userId}`)
      .then(res => setRecommendations(res.data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">All Products</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {products.map(product => <ProductCard key={product._id} product={product} />)}
      </div>

      <RecommendationList products={recommendations} />
    </div>
  );
};

export default Home;
