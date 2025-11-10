import React from "react";

const ProductCard = ({ product }) => {
  return (
    <div className="border rounded shadow p-3">
      <img src={product.image} alt={product.name} className="w-full h-48 object-cover" />
      <h3 className="font-bold mt-2">{product.name}</h3>
      <p className="text-gray-500">{product.category}</p>
      <p className="text-blue-600 font-semibold">${product.price}</p>
    </div>
  );
};

export default ProductCard;
