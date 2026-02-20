import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Star, ShoppingCart, TrendingUp, Sparkles, ChevronRight,
  Tag, Truck, ShieldCheck, RefreshCw, Headphones, ArrowRight,
  Flame, Clock, ChevronLeft,
} from "lucide-react";
import HeroSlider from "../components/HeroSlider";
import ProductCard from "../components/ProductCard";
import api from "../api/api";
import { notifyProfileSaved } from '../utils/profileToast';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const CATEGORY_ICONS = {
  Electronics: "💻", Fashion: "👗", "Home & Garden": "🏡", Sports: "⚽",
  Beauty: "💄", Books: "📚", Toys: "🧸", Automotive: "🚗",
  Health: "💊", Food: "🍎", Furniture: "🛋️", Jewelry: "💍",
  Other: "📦",
};
const catIcon = (c) => CATEGORY_ICONS[c] || "🛍️";

const TRUST_BADGES = [
  { icon: <Truck size={22} className="text-blue-600" />, title: "Free Shipping", sub: "On orders over Rs 999" },
  { icon: <ShieldCheck size={22} className="text-green-600" />, title: "Secure Payment", sub: "100% protected checkout" },
  { icon: <RefreshCw size={22} className="text-purple-600" />, title: "Easy Returns", sub: "7-day hassle-free return" },
  { icon: <Headphones size={22} className="text-orange-600" />, title: "24/7 Support", sub: "Always here to help you" },
];

// ─── Section Header ───────────────────────────────────────────────────────────
const SectionHeader = ({ icon, title, subtitle, linkLabel, linkTo }) => (
  <div className="flex items-end justify-between mb-5">
    <div>
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">{title}</h2>
      </div>
      {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
    </div>
    {linkTo && (
      <a href={linkTo} className="hidden sm:flex items-center gap-1 text-blue-600 text-sm font-semibold hover:underline shrink-0">
        {linkLabel || "See all"} <ChevronRight size={15} />
      </a>
    )}
  </div>
);

// ─── Horizontal scroll row ────────────────────────────────────────────────────
const ProductRow = ({ products, handlers }) => {
  const ref = useRef(null);
  const scroll = (dir) => ref.current?.scrollBy({ left: dir * 280, behavior: "smooth" });

  return (
    <div className="relative group">
      <button onClick={() => scroll(-1)}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg p-2 rounded-full border opacity-0 group-hover:opacity-100 transition -ml-4 hidden sm:flex">
        <ChevronLeft size={18} />
      </button>
      <div ref={ref} className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-1 px-1">
        {products.map((p) => (
          <div key={p._id || p.id} className="min-w-[200px] sm:min-w-[220px] max-w-[220px] flex-shrink-0">
            <ProductCard product={p} {...handlers} />
          </div>
        ))}
      </div>
      <button onClick={() => scroll(1)}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg p-2 rounded-full border opacity-0 group-hover:opacity-100 transition -mr-4 hidden sm:flex">
        <ChevronRight size={18} />
      </button>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const PRODUCTS_PER_PAGE = 12;

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const [visibleCount, setVisibleCount] = useState(PRODUCTS_PER_PAGE);
  const [searchQuery, setSearchQuery] = useState("");

  // ── Fetch ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await api.get("/products");
        if (mounted) setAllProducts(res.products || []);
      } catch (err) {
        console.error("Failed to fetch products", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    const handler = () => load();
    window.addEventListener("products-updated", handler);
    return () => { mounted = false; window.removeEventListener("products-updated", handler); };
  }, []);

  // ── Derived data ─────────────────────────────────────────────────────────────
  const categories = useMemo(() => {
    const cats = [...new Set(allProducts.map((p) => p.category).filter(Boolean))].sort();
    return ["All", ...cats];
  }, [allProducts]);

  const trendingProducts = useMemo(
    () => [...allProducts].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 10),
    [allProducts]
  );

  const newArrivals = useMemo(
    () => [...allProducts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 10),
    [allProducts]
  );

  const flashDeals = useMemo(
    () => allProducts.filter((p) => (p.stock || 0) > 0 && (p.stock || 0) <= 15).slice(0, 10),
    [allProducts]
  );

  const filteredProducts = useMemo(() => {
    let list = activeCategory === "All" ? allProducts : allProducts.filter((p) => p.category === activeCategory);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((p) => (p.name || p.title || "").toLowerCase().includes(q) || (p.category || "").toLowerCase().includes(q));
    }
    return list;
  }, [allProducts, activeCategory, searchQuery]);

  const visibleProducts = filteredProducts.slice(0, visibleCount);

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const goToProduct = useCallback((product) => {
    const id = product._id || product.id;
    if (id) navigate(`/product/${id}`);
  }, [navigate]);

  const handleAddToCart = useCallback(async (product) => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/login"); return; }
    try {
      await api.post(`/user/cart/${product._id || product.id}`);
      notifyProfileSaved('Added to cart');
      window.dispatchEvent(new CustomEvent("cart-updated", { detail: { delta: 1 } }));
    } catch (err) {
      console.error("Add to cart failed", err);
    }
  }, [navigate]);

  const handlers = { onView: goToProduct, onAddToCart: handleAddToCart };

  // ── Reset pagination on category/search change ────────────────────────────────
  useEffect(() => { setVisibleCount(PRODUCTS_PER_PAGE); }, [activeCategory, searchQuery]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-500">Loading store…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Hero ── */}
      <HeroSlider />

      {/* ── Trust Badges ── */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          {TRUST_BADGES.map(({ icon, title, sub }) => (
            <div key={title} className="flex items-center gap-3">
              <div className="shrink-0">{icon}</div>
              <div>
                <p className="font-semibold text-gray-800 text-sm">{title}</p>
                <p className="text-xs text-gray-500">{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Shop by Category ── */}
      {categories.length > 1 && (
        <section className="bg-white py-6 border-b">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-base font-bold text-gray-700 mb-4 uppercase tracking-wide">Shop by Category</h2>
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
              {categories.filter((c) => c !== "All").map((cat) => (
                <button
                  key={cat}
                  onClick={() => { setActiveCategory(cat); document.getElementById("all-products")?.scrollIntoView({ behavior: "smooth" }); }}
                  className="flex flex-col items-center gap-1.5 shrink-0 group"
                >
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-50 to-indigo-100 border-2 border-transparent group-hover:border-blue-500 transition flex items-center justify-center text-2xl shadow-sm">
                    {catIcon(cat)}
                  </div>
                  <span className="text-xs font-medium text-gray-700 group-hover:text-blue-600 transition text-center leading-tight max-w-[72px]">{cat}</span>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-12">

        {/* ── Flash Deals ── */}
        {flashDeals.length > 0 && (
          <section id="flash">
            <div className="bg-gradient-to-r from-red-600 to-orange-500 rounded-2xl p-1 shadow-lg">
              <div className="bg-white rounded-xl p-5">
                <SectionHeader
                  icon={<Flame size={22} className="text-red-500" />}
                  title="Flash Deals"
                  subtitle="Limited stock — grab them before they're gone!"
                  linkLabel="View all deals"
                  linkTo="#all-products"
                />
                <ProductRow products={flashDeals} handlers={handlers} />
              </div>
            </div>
          </section>
        )}

        {/* ── Trending Products ── */}
        {trendingProducts.length > 0 && (
          <section id="trending">
            <SectionHeader
              icon={<TrendingUp size={22} className="text-orange-500" />}
              title="Trending Products"
              subtitle="Most popular picks right now"
              linkLabel="See all trending"
              linkTo="#all-products"
            />
            <ProductRow products={trendingProducts} handlers={handlers} />
          </section>
        )}

        {/* ── Promo Banner ── */}
        <section>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-700 p-6 flex flex-col justify-between min-h-[140px] shadow-lg">
              <div>
                <span className="text-xs font-semibold text-blue-200 uppercase tracking-wider">Exclusive offer</span>
                <h3 className="text-2xl font-extrabold text-white mt-1 leading-tight">Up to 40% Off<br />Electronics</h3>
              </div>
              <button
                onClick={() => { setActiveCategory("Electronics"); document.getElementById("all-products")?.scrollIntoView({ behavior: "smooth" }); }}
                className="mt-4 inline-flex items-center gap-2 bg-white text-blue-700 font-bold px-4 py-2 rounded-full text-sm hover:bg-blue-50 transition w-fit"
              >
                Shop Now <ArrowRight size={14} />
              </button>
              <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full" />
              <div className="absolute -right-2 bottom-4 w-20 h-20 bg-white/10 rounded-full" />
            </div>
            <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-purple-500 to-pink-600 p-6 flex flex-col justify-between min-h-[140px] shadow-lg">
              <div>
                <span className="text-xs font-semibold text-purple-200 uppercase tracking-wider">New season</span>
                <h3 className="text-2xl font-extrabold text-white mt-1 leading-tight">Fresh Fashion<br />Arrivals</h3>
              </div>
              <button
                onClick={() => { setActiveCategory("Fashion"); document.getElementById("all-products")?.scrollIntoView({ behavior: "smooth" }); }}
                className="mt-4 inline-flex items-center gap-2 bg-white text-purple-700 font-bold px-4 py-2 rounded-full text-sm hover:bg-purple-50 transition w-fit"
              >
                Explore <ArrowRight size={14} />
              </button>
              <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full" />
            </div>
          </div>
        </section>

        {/* ── New Arrivals ── */}
        {newArrivals.length > 0 && (
          <section>
            <SectionHeader
              icon={<Sparkles size={22} className="text-yellow-500" />}
              title="New Arrivals"
              subtitle="Fresh products added to the store"
              linkLabel="See all new"
              linkTo="#all-products"
            />
            <ProductRow products={newArrivals} handlers={handlers} />
          </section>
        )}

        {/* ── Personalized ── */}
        {user && (
          <section className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
            <div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-white mb-1">
                Hi {user.name?.split(" ")[0]}! 👋 Your personal picks are ready.
              </h3>
              <p className="text-blue-100 text-sm">AI-curated recommendations based on your browsing and preferences.</p>
            </div>
            <Link
              to="/recommendations"
              className="shrink-0 bg-white text-blue-700 font-bold px-6 py-3 rounded-full hover:bg-blue-50 transition shadow flex items-center gap-2"
            >
              View My Picks <ArrowRight size={16} />
            </Link>
          </section>
        )}

        {/* ── All Products ── */}
        <section id="all-products">
          <SectionHeader
            icon={<Tag size={22} className="text-blue-600" />}
            title="All Products"
            subtitle={`${filteredProducts.length} products${activeCategory !== "All" ? ` in ${activeCategory}` : ""}`}
          />

          {/* Search + Category Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1 max-w-sm">
              <input
                type="text"
                placeholder="Search products…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-4 pr-4 py-2.5 border border-gray-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition border ${
                    activeCategory === cat
                      ? "bg-blue-600 text-white border-blue-600 shadow"
                      : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Products Grid */}
          {visibleProducts.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border">
              <p className="text-gray-400 text-lg">No products found.</p>
              <button onClick={() => { setActiveCategory("All"); setSearchQuery(""); }} className="mt-3 text-blue-600 text-sm underline">
                Clear filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {visibleProducts.map((p) => (
                  <ProductCard key={p._id || p.id} product={p} {...handlers} />
                ))}
              </div>

              {/* Load More */}
              {visibleCount < filteredProducts.length && (
                <div className="text-center mt-8">
                  <button
                    onClick={() => setVisibleCount((c) => c + PRODUCTS_PER_PAGE)}
                    className="inline-flex items-center gap-2 bg-blue-600 text-white font-semibold px-8 py-3 rounded-full hover:bg-blue-700 transition shadow-lg"
                  >
                    Load More
                    <span className="text-xs bg-blue-500 px-2 py-0.5 rounded-full">
                      +{Math.min(PRODUCTS_PER_PAGE, filteredProducts.length - visibleCount)}
                    </span>
                  </button>
                  <p className="text-xs text-gray-400 mt-2">
                    Showing {visibleCount} of {filteredProducts.length}
                  </p>
                </div>
              )}
            </>
          )}
        </section>

      </div>

      {/* ── Newsletter ── */}
      <section className="bg-gradient-to-r from-slate-800 to-slate-900 py-12 mt-12">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">Get Exclusive Deals</h2>
          <p className="text-slate-400 text-sm mb-6">Subscribe for the latest offers, new arrivals & personalized recommendations.</p>
          <div className="flex gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Your email address"
              className="flex-1 px-4 py-3 rounded-xl text-sm focus:outline-none shadow"
            />
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl transition shadow shrink-0">
              Subscribe
            </button>
          </div>
        </div>
      </section>

      {/* scrollbar-hide util */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default Home;
