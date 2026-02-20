import React from "react";
import Slider from "react-slick";
import { Link } from "react-router-dom";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

import banner1 from "/image/banner1.jpeg";
import banner2 from "/image/banner2.jpeg";
import banner3 from "/image/banner3.jpeg";
import banner4 from "/image/banner4.jpeg";

const slides = [
  { img: banner1, tag: "New Arrivals", title: "Discover Amazing\nProducts", sub: "AI-powered picks just for you", cta: "Shop Now", ctaLink: "#all-products", color: "from-blue-900/70" },
  { img: banner2, tag: "Flash Deals", title: "Unbeatable Prices\nEvery Day", sub: "Limited-time offers you can't miss", cta: "View Deals", ctaLink: "#flash", color: "from-orange-900/70" },
  { img: banner3, tag: "Trending", title: "What Everyone\nIs Buying", sub: "Top-rated products loved by thousands", cta: "Explore Now", ctaLink: "#trending", color: "from-purple-900/70" },
  { img: banner4, tag: "Best Value", title: "Premium Quality\nGreat Prices", sub: "Curated picks at the best value", cta: "Browse All", ctaLink: "#all-products", color: "from-teal-900/70" },
];

const Arrow = ({ className, style, onClick, dir }) => (
  <button
    className={`${className} !flex items-center justify-center !w-10 !h-10 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-sm border border-white/30 text-white transition z-10`}
    style={{ ...style, display: "flex", [dir === "prev" ? "left" : "right"]: "16px" }}
    onClick={onClick}
  >
    {dir === "prev" ? "‹" : "›"}
  </button>
);

const HeroSlider = () => {
  const settings = {
    dots: true,
    infinite: true,
    speed: 700,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 4000,
    prevArrow: <Arrow dir="prev" />,
    nextArrow: <Arrow dir="next" />,
    dotsClass: "slick-dots !bottom-4",
  };

  return (
    <section className="w-full overflow-hidden">
      <Slider {...settings}>
        {slides.map((s, i) => (
          <div key={i} className="relative">
            <div className="relative h-[320px] sm:h-[420px] md:h-[500px] w-full">
              <img src={s.img} alt={s.title} className="w-full h-full object-cover" />
              <div className={`absolute inset-0 bg-gradient-to-r ${s.color} to-transparent`} />
              <div className="absolute inset-0 flex flex-col justify-center px-8 sm:px-16 md:px-24">
                <span className="inline-block bg-white/20 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1 rounded-full mb-3 w-fit border border-white/30">
                  {s.tag}
                </span>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white leading-tight mb-3 whitespace-pre-line drop-shadow-lg">
                  {s.title}
                </h1>
                <p className="text-white/80 text-sm sm:text-base mb-6 max-w-sm">{s.sub}</p>
                <a
                  href={s.ctaLink}
                  className="inline-flex items-center gap-2 bg-white text-gray-900 font-bold px-6 py-3 rounded-full hover:bg-gray-100 transition shadow-lg w-fit text-sm sm:text-base"
                >
                  {s.cta} <span>→</span>
                </a>
              </div>
            </div>
          </div>
        ))}
      </Slider>
    </section>
  );
};

export default HeroSlider;

