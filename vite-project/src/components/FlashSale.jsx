import React from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

// Example placeholder products
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
  {
    id: 7,
    name: "Women's Jacket",
    price: 2499,
    oldPrice: 3999,
    img: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 8,
    name: "Laptop Bag",
    price: 1299,
    oldPrice: 1999,
    img: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=800&q=80",
  },
];


const FlashSale = () => {
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

  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-2xl font-bold mb-6">🔥 Flash Sale</h2>
        <Slider {...settings} className="group">
          {flashProducts.map((p) => (
            <div key={p.id} className="p-2">
              <div className="bg-white border rounded-lg overflow-hidden shadow hover:shadow-lg transition">
                <div className="relative">
                  <img
                    src={p.img}
                    alt={p.name}
                     class="w-full h-70 object-cover rounded-md shadow-sm"
                  />
                  <span className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded">
                    Sale
                  </span>
                </div>
                <div className="p-4 flex flex-col items-center">
                  <h3 className="font-semibold text-gray-800 mb-2 text-center">{p.name}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-red-600">Rs {p.price}</span>
                    <span className="text-sm text-gray-500 line-through">Rs {p.oldPrice}</span>
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
