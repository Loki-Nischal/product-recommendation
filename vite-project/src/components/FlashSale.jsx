import React, { useState, useEffect } from "react";
import Slider from "react-slick";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/api";

import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const FlashSale = () => {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchProducts = async () => {
      try {
        const response = await api.get("/products");
        const fetchedProducts = response.products || [];
        if (!mounted) return;
        setProducts(Array.isArray(fetchedProducts) ? fetchedProducts.slice(0, 6) : []);
      } catch (error) {
        console.error("Error fetching products:", error);
        if (mounted) setProducts([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchProducts();

    const handler = () => {
      // on product update, re-fetch latest products
      fetchProducts();
    };

    window.addEventListener("products-updated", handler);

    return () => {
      mounted = false;
      window.removeEventListener("products-updated", handler);
    };
  }, []);

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

  if (loading) {
    return (
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl font-bold mb-6">🔥 Flash Sale</h2>
          <div className="text-center py-8">
            <p className="text-gray-500">Loading flash sale products...</p>
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0) {
    return (
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl font-bold mb-6">🔥 Flash Sale</h2>
          <div className="text-center py-8">
            <p className="text-gray-500">No products available for flash sale yet.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-2xl font-bold mb-6">🔥 Flash Sale</h2>

        <Slider {...settings}>
          {products.map((p) => (
            <div
              key={p._id || p.id}
              className="p-2 cursor-pointer"
              onClick={() => handleClick(p._id || p.id)}
            >
              <div className="bg-white border rounded-lg overflow-hidden shadow hover:shadow-lg transition">
                <div className="relative">
                  <img
                    src={p.image || p.img || "https://via.placeholder.com/300"}
                    alt={p.title || p.name}
                    className="w-full h-60 object-cover rounded-md shadow-sm"
                  />
                  <span className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded">
                    Sale
                  </span>
                </div>

                <div className="p-4 flex flex-col items-center">
                  <h3 className="font-semibold text-gray-800 mb-2 text-center">
                    {p.title || p.name}
                  </h3>

                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-red-600">
                      Rs {p.price}
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
