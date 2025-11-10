import React from "react";
import ProductCard from "./ProductCard";

const RecommendationList = ({ products }) => {
  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Recommended for You</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {products.map((product) => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>
    </div>
  );
};

export default RecommendationList;
