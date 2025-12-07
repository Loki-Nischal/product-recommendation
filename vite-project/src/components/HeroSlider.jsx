import React from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

import banner1 from "/image/banner1.jpeg";
import banner2 from "/image/banner2.jpeg";
import banner3 from "/image/banner3.jpeg";
import banner4 from "/image/banner4.jpeg";

const HeroSlider = () => {
  const sliderImages = [banner1, banner2, banner3, banner4];

  const settings = {
    dots: true,
    infinite: true,
    speed: 600,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 2500,
    arrows: true,
  };

  return (
    <section className="w-full bg-gray-100 py-12">
      <div className="container mx-auto flex flex-col md:flex-row items-center gap-6">
        
        {/* Left Content */}
        <div className="md:w-[70%] flex flex-col justify-center space-y-6 px-4">
          <h1 className="text-4xl md:text-5xl font-bold text-blue-700">
            Discover Amazing Products
          </h1>
          <p className="text-gray-700 text-lg">
            AI-powered recommendations, personalized for you. Shop the best products effortlessly.
          </p>
          <div className="flex gap-4">
            <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
              Shop Now
            </button>
            <button className="border border-blue-600 text-blue-600 px-6 py-3 rounded-lg hover:bg-blue-100 transition-colors">
              Explore Deals
            </button>
          </div>
        </div>

        {/* Right Slider */}
        <div className="md:w-[30%] ">
          <Slider {...settings} className="forced-color-adjust-auto ">
            {sliderImages.map((src, index) => (
              <div key={index}>
                <img
                  src={src}
                  alt={`Banner ${index + 1}`}
                  className="w-full h-[200px] md:h-[200px] object-cover rounded-lg"
                />
              </div>
            ))}
          </Slider>
        </div>

      </div>
    </section>
  );
};

export default HeroSlider;
