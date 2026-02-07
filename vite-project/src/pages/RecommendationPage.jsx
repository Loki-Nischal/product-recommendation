import React, { useEffect, useState } from "react";
import API from "../api/api";
import ProductCard from "../components/ProductCard";

export default function RecommendationPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [query, setQuery] = useState("");
  const [semantic, setSemantic] = useState(false);

  // =============================
  // FETCH RECOMMENDATIONS (DEFAULT)
  // =============================
  const fetchRecommendations = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await API.get("/recommendations");
      if (res?.success) {
        setProducts(res.products || []);
      } else {
        setError("Failed to load recommendations");
      }
    } catch (err) {
      setError(err?.message || "Failed to load recommendations");
    } finally {
      setLoading(false);
    }
  };

  // =============================
  // SEARCH (NORMAL / SEMANTIC)
  // =============================
  const searchProducts = async () => {
    if (!query.trim()) {
      fetchRecommendations();
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const endpoint = semantic
        ? `/products/semantic?q=${query}`
        : `/products/search?q=${query}`;

      const res = await API.get(endpoint);

      if (res?.success) {
        setProducts(res.products || []);
      } else {
        setError("Search failed");
      }
    } catch (err) {
      setError(err?.message || "Search failed");
    } finally {
      setLoading(false);
    }
  };

  // Load recommendations on page load
  useEffect(() => {
    fetchRecommendations();
  }, []);

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Recommended For You</h1>

      {/* SEARCH BAR */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <input
          type="text"
          placeholder="Search products..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="border p-3 rounded-lg w-full md:w-2/3"
        />

        <button
          onClick={searchProducts}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
        >
          Search
        </button>
      </div>

      {/* SEMANTIC TOGGLE */}
      <div className="flex items-center gap-2 mb-6">
        <input
          type="checkbox"
          id="semantic"
          checked={semantic}
          onChange={() => setSemantic(!semantic)}
        />
        <label htmlFor="semantic" className="text-sm font-medium">
          Enable Semantic Search
        </label>
      </div>

      {/* STATES */}
      {loading && <div>Loading...</div>}
      {error && <div className="text-red-500">{error}</div>}

      {!loading && products.length === 0 && (
        <div className="text-gray-600">
          No recommendations or search results found.
        </div>
      )}

      {/* PRODUCT GRID */}
      {!loading && products.length > 0 && (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <ProductCard key={p._id} product={p} showBadges={false} />
          ))}
        </div>
      )}
    </div>
  );
}
