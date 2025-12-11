import React from "react";
import { useParams } from "react-router-dom";

const flashProducts = [
  {
    id: 1,
    name: "Wireless Headphones",
    price: 2999,
    oldPrice: 4999,
    img: "/image/headphone.jpeg",
    description: "High-quality wireless headphones with deep bass and long battery life.",
    specs: {
      Brand: "AudioMax",
      Battery: "20 hours",
      Connectivity: "Bluetooth 5.0",
      Warranty: "1 Year"
    },
    rating: 4.5,
  },
  {
    id: 2,
    name: "Smart Watch",
    price: 2499,
    oldPrice: 3999,
    img: "/image/smartwatch.jpeg",
    description: "Waterproof smartwatch with health tracking and customizable watch faces.",
    specs: {
      Brand: "WatchPro",
      Battery: "7 days",
      Features: "Heart rate • Sleep tracking • GPS",
      Warranty: "1 Year"
    },
    rating: 4.2,
  },
  {
    id: 3,
    name: "Gaming Mouse",
    price: 799,
    oldPrice: 1499,
    img: "/image/mouse.jpeg",
    description: "RGB gaming mouse with ultra-fast response time and ergonomic design.",
    specs: {
      Brand: "GameTech",
      DPI: "6400 DPI",
      Buttons: "7 Programmable",
      Warranty: "6 Months"
    },
    rating: 4.0,
  },
];

const ProductDetails = () => {
  const { id } = useParams();
  const product = flashProducts.find((p) => p.id === parseInt(id));

  if (!product)
    return (
      <div className="p-10 text-center text-xl font-semibold text-red-500">
        Product not found!
      </div>
    );

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-10">
      {/* TOP SECTION */}
      <div className="flex flex-col md:flex-row gap-10">
        
        {/* LEFT: PRODUCT IMAGE */}
        <div className="md:w-1/2">
          <img
            src={product.img}
            alt={product.name}
            className="w-full h-[380px] object-cover rounded-lg shadow"
          />
        </div>

        {/* RIGHT: PRODUCT DETAILS */}
        <div className="md:w-1/2 space-y-5">
          <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>

          {/* Rating */}
          <div className="flex items-center gap-2">
            <span className="text-yellow-500 text-xl">⭐</span>
            <span className="text-gray-600">{product.rating} / 5</span>
          </div>

          {/* Price */}
          <div className="flex items-center gap-4">
            <span className="text-4xl font-bold text-red-600">Rs {product.price}</span>
            <span className="text-gray-500 line-through text-xl">Rs {product.oldPrice}</span>
          </div>

          {/* Description */}
          <p className="text-gray-700 text-lg">{product.description}</p>

          {/* Add to Cart */}
          <button className="bg-blue-600 text-white px-6 py-3 rounded-lg w-full md:w-auto hover:bg-blue-700 transition">
            Add to Cart
          </button>
        </div>
      </div>

      {/* SPECIFICATIONS */}
      <div className="mt-14 bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-5">Specifications</h2>
        <div className="space-y-3">
          {Object.entries(product.specs).map(([key, value]) => (
            <div key={key} className="flex justify-between border-b pb-2">
              <span className="font-medium text-gray-700">{key}</span>
              <span className="text-gray-600">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* RELATED PRODUCTS */}
      <div className="mt-14">
        <h2 className="text-2xl font-bold mb-6">You May Also Like</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {flashProducts
            .filter((p) => p.id !== product.id)
            .map((related) => (
              <a
                href={`/product/${related.id}`}
                key={related.id}
                className="border rounded-lg shadow hover:shadow-lg transition p-3"
              >
                <img
                  src={related.img}
                  className="w-full h-40 object-cover rounded"
                />
                <h3 className="font-semibold mt-3">{related.name}</h3>
                <p className="text-red-600 font-bold">Rs {related.price}</p>
              </a>
            ))}
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
