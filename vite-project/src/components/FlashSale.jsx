import React from "react";
import Slider from "react-slick";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; // <-- MUST BE CORRECT PATH

import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const flashProducts = [
  {
    id: 1,
    name: "Wireless Headphones",
    price: 2999,
    oldPrice: 4999,
    img: "/image/headphone.jpeg",
  },
  {
    id: 2,
    name: "Smart Watch",
    price: 2499,
    oldPrice: 3999,
    img: "/image/smartwatch.jpeg",
  },
  {
    id: 3,
    name: "Gaming Mouse",
    price: 799,
    oldPrice: 1499,
    img: "/image/mouse.jpeg",
  },
  {
    id: 4,
    name: "Bluetooth Speaker",
    price: 1299,
    oldPrice: 2299,
    img: "/image/speaker.jpeg",
  },
  {
    id: 5,
    name: "LED Monitor",
    price: 10999,
    oldPrice: 14999,
    img: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 6,
    name: "Running Shoes",
    price: 1999,
    oldPrice: 3499,
    img: "https://images.unsplash.com/photo-1528701800489-20be3c059f56?auto=format&fit=crop&w=800&q=80",
  },
];

const FlashSale = () => {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth(); // <-- detect if logged in

  const settings = {
    dots: false,
    infinite: true,
    speed: 500,
    slidesToShow: 4,
    slidesToScroll: 1,
    responsive: [
      { breakpoint: 1024, settings: { slidesToShow: 3 } },
      { breakpoint: 768, settings: { slidesToShow: 2 } },
      { breakpoint: 480, settings: { slidesToShow: 1 } },
    ],
    arrows: true,
  };

  // HANDLE PRODUCT CLICK
  const handleClick = (productId) => {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }
    navigate(`/product/${productId}`);
  };

  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-2xl font-bold mb-6">🔥 Flash Sale</h2>

        <Slider {...settings}>
          {flashProducts.map((p) => (
            <div
              key={p.id}
              className="p-2 cursor-pointer"
              onClick={() => handleClick(p.id)}
            >
              <div className="bg-white border rounded-lg overflow-hidden shadow hover:shadow-lg transition">
                <div className="relative">
                  <img
                    src={p.img}
                    alt={p.name}
                    className="w-full h-60 object-cover rounded-md shadow-sm"
                  />
                  <span className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded">
                    Sale
                  </span>
                </div>

                <div className="p-4 flex flex-col items-center">
                  <h3 className="font-semibold text-gray-800 mb-2 text-center">
                    {p.name}
                  </h3>

                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-red-600">
                      Rs {p.price}
                    </span>
                    <span className="text-sm text-gray-500 line-through">
                      Rs {p.oldPrice}
                    </span>
                  </div>

                  <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          ))}
        </Slider>
      </div>
    </section>
  );
};

export default FlashSale;
