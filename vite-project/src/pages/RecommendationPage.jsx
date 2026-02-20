import React, { useEffect, useState } from "react";
import API from "../api/api";
import { notifyProfileSaved } from '../utils/profileToast';
import ProductCard from "../components/ProductCard";

export default function RecommendationPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [query, setQuery] = useState("");
  const [semantic, setSemantic] = useState(false);
  const SEARCH_HISTORY_KEY = 'productSearchHistory';
  const MAX_HISTORY_ITEMS = 8;
  const [searchHistory, setSearchHistory] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

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
  const searchProducts = async (inputQ) => {
    const q = (typeof inputQ === 'string' ? inputQ : query) || '';
    if (!q.trim()) {
      fetchRecommendations();
      return;
    }

    setLoading(true);
    setError(null);

    // Persist search to backend profile and local cache
    const normalized = q.trim();
    if (normalized) {
      // update local history
      try {
        const raw = localStorage.getItem(SEARCH_HISTORY_KEY);
        const arr = raw ? JSON.parse(raw) : [];
        const next = Array.isArray(arr) ? arr.filter((s) => s.toLowerCase() !== normalized.toLowerCase()) : [];
        next.unshift(normalized);
        const sliced = next.slice(0, MAX_HISTORY_ITEMS);
        localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(sliced));
        setSearchHistory(sliced);
      } catch (e) {
        // ignore
      }

      const token = localStorage.getItem('token');
      if (token) {
        API.post('/user/search', { query: normalized })
          .then(() => notifyProfileSaved('Search saved to profile'))
          .catch((err) => console.debug('Failed to persist search:', err));
      }
    }

    try {
      const endpoint = semantic
        ? `/products/semantic?q=${encodeURIComponent(q)}`
        : `/products/search?q=${encodeURIComponent(q)}`;

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

  // Load recommendations on page load and seed local profile cache first
  useEffect(() => {
    let mounted = true;
    const seedLocalProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const raw = localStorage.getItem('likedProductIds');
        if (raw) return; // already seeded
        const res = await API.get('/user/profile');
        if (res && res.success && res.data) {
          const profile = res.data;
          const liked = Array.isArray(profile.likedProducts)
            ? profile.likedProducts.map((p) => p._id || p.id).filter(Boolean)
            : [];
          const viewed = Array.isArray(profile.viewedProducts)
            ? profile.viewedProducts.map((p) => p._id || p.id).filter(Boolean)
            : [];
          try {
            localStorage.setItem('likedProductIds', JSON.stringify(liked));
            localStorage.setItem('viewedProductIds', JSON.stringify(viewed));
          } catch (e) {
            // ignore storage errors
          }
        }
      } catch (e) {
        // ignore
      }
    };

    // seed local search history from localStorage
    try {
      const raw = localStorage.getItem(SEARCH_HISTORY_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setSearchHistory(parsed.slice(0, MAX_HISTORY_ITEMS));
      }
    } catch (e) {
      // ignore
    }
    const init = async () => {
      await seedLocalProfile();
      if (!mounted) return;
      fetchRecommendations();
    };

    init();

    const handler = () => fetchRecommendations();
    window.addEventListener('products-updated', handler);

    return () => {
      mounted = false;
      window.removeEventListener('products-updated', handler);
    };
  }, []);

  const clearSearchHistory = () => {
    try {
      localStorage.removeItem(SEARCH_HISTORY_KEY);
    } catch (e) {
      // ignore
    }
    setSearchHistory([]);
  };

  // Clear both local cache and server-side saved history when logged in
  const clearSearchHistoryAndPersist = async () => {
    clearSearchHistory();
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await API.post('/user/search/clear');
        notifyProfileSaved('Search history cleared');
      }
    } catch (err) {
      console.debug('Failed to clear server-side search history:', err);
    }
  };

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
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          className="border p-3 rounded-lg w-full md:w-2/3"
        />

        <button
          onClick={searchProducts}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
        >
          Search
        </button>
      </div>

      {/* Search history suggestions */}
      {searchHistory && searchHistory.length > 0 && (
        <div className="mb-4 max-w-md relative">
          <div className="bg-white border rounded shadow">
            <div className="flex items-center justify-between px-3 py-2 border-b bg-gray-50">
              <div className="text-sm font-medium flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Recent searches
              </div>
              <div>
                <button
                  type="button"
                  onClick={clearSearchHistoryAndPersist}
                  className="text-sm text-red-600 hover:underline"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* suggestions list: show when input focused or query matches */}
            <div>
              {(showSuggestions || query) && (
                <div>
                  {searchHistory
                    .filter((item) => item && item.toLowerCase().includes((query || "").toLowerCase()))
                    .slice(0, MAX_HISTORY_ITEMS)
                    .map((item, idx) => (
                      <button
                        key={item + idx}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()} /* keep focus */
                        onClick={() => {
                          setQuery(item);
                          searchProducts(item);
                          setShowSuggestions(false);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 border-b last:border-b-0 flex items-center gap-3"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 4a7 7 0 100 14 7 7 0 000-14z" />
                        </svg>
                        <span className="truncate">{item}</span>
                      </button>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
