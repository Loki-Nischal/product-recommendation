import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ProductCard from './ProductCard';
import UserPreferences from './UserPreferences';
import AdvancedFilters from './AdvancedFilters';
import { useRecommendation } from '../hooks/useRecommendation';
import { useDebounce } from '../hooks/useDebounce';
import api from '../api/api';
import { notifyProfileSaved } from '../utils/profileToast';
import { Filter, Grid, Search, Loader } from 'lucide-react';
import { recommendationAlgorithms, generateExplanation } from '../utils/recommendationAlgorithms';

const RecommendationEngine = () => {
  const SEARCH_HISTORY_KEY = 'productSearchHistory';
  const MAX_HISTORY_ITEMS = 8;

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [userPreferences, setUserPreferences] = useState({
    preferredCategories: [],
    interests: [],
    priceRange: [0, 500]
  });

  const [userBehavior, setUserBehavior] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchHistory, setSearchHistory] = useState([]);
  const [showSearchHistory, setShowSearchHistory] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const searchBoxRef = useRef(null);
  
  const [advancedFilters, setAdvancedFilters] = useState({
    categories: [],
    brands: [],
    tags: [],
    priceRange: [0, 500],
    rating: 0
  });
  const navigate = useNavigate();

  // Fetch products from backend
  useEffect(() => {
    let mounted = true;

    const fetchProducts = async () => {
      try {
        if (mounted) setLoading(true);
        if (mounted) setError(null);
        const response = await api.get('/products');
        const fetchedProducts = response.products || [];
        if (!mounted) return;
        setProducts(Array.isArray(fetchedProducts) ? fetchedProducts : []);
      } catch (err) {
        console.error('Error fetching products:', err);
        if (mounted) {
          setError('Failed to load products. Please try again later.');
          setProducts([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchProducts();

    const handler = () => {
      // refetch products when an admin updates a product elsewhere
      fetchProducts();
    };

    window.addEventListener('products-updated', handler);

    return () => {
      mounted = false;
      window.removeEventListener('products-updated', handler);
    };
  }, []);

  // Load stored search history once
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SEARCH_HISTORY_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setSearchHistory(parsed.filter((item) => typeof item === 'string' && item.trim()));
      }
    } catch (e) {
      setSearchHistory([]);
    }
  }, []);

  // Close history dropdown when user clicks outside search box
  useEffect(() => {
    const onClickOutside = (event) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(event.target)) {
        setShowSearchHistory(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const persistSearchHistory = (history) => {
    try {
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
    } catch (e) {
      // ignore persistence errors
    }
  };

  const saveSearchToHistory = (term) => {
    const normalized = (term || '').trim();
    if (!normalized) return;

    setSearchHistory((prev) => {
      const withoutDupes = prev.filter((item) => item.toLowerCase() !== normalized.toLowerCase());
      const updated = [normalized, ...withoutDupes].slice(0, MAX_HISTORY_ITEMS);
      persistSearchHistory(updated);
      return updated;
    });

    // Persist to backend
    const token = localStorage.getItem('token');
    if (token) {
      api.post('/user/search', { query: normalized })
        .then(() => notifyProfileSaved('Search saved to profile'))
        .catch((err) => console.debug('Failed to persist search:', err));
    }
  };

  const clearSearchHistory = () => {
    setSearchHistory([]);
    try {
      localStorage.removeItem(SEARCH_HISTORY_KEY);
    } catch (e) {
      // ignore storage errors
    }
    setShowSearchHistory(false);
  };

  // clear server-side saved history when logged in
  const clearSearchHistoryAndPersist = async () => {
    clearSearchHistory();
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await api.post('/user/search/clear');
        notifyProfileSaved('Search history cleared');
      }
    } catch (err) {
      console.debug('Failed to clear server-side search history:', err);
    }
  };

  const filteredHistory = searchTerm.trim()
    ? searchHistory.filter((item) => item.toLowerCase().includes(searchTerm.toLowerCase()))
    : searchHistory;

  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  // Use the shared hook which now prefers backend personalized recommendations
  const [recommendations, isPersonalized] = useRecommendation(products, userPreferences, userBehavior);
  const [algorithmMode, setAlgorithmMode] = useState('auto'); // 'auto' | 'collaborative' | 'content'
  const [localRecommendations, setLocalRecommendations] = useState([]);

  // cart badge is handled by `Navbar`; no local badge logic needed here

  // Filter products based on search, category, and advanced filters
  const filteredProducts = products.filter(product => {
    // Defensive property access and normalization
    const name = String(product.name || product.title || '').toLowerCase();
    const title = String(product.title || product.name || '').toLowerCase();
    const category = String(product.category || '').toLowerCase();
    const brand = String(product.brand || '').toLowerCase();
    const rating = Number(product.rating || 0);
    const price = Number(product.price || 0);
    const tags = Array.isArray(product.tags) ? product.tags.map(t => String(t).toLowerCase()) : [];

    // Search matching (defensive)
    const searchLower = String(debouncedSearchTerm || '').toLowerCase();
    const matchesSearch = searchLower === '' ||
                         name.includes(searchLower) ||
                         title.includes(searchLower) ||
                         tags.some(tag => tag.includes(searchLower));

    // If user is actively searching, allow matches across all categories
    const matchesCategory = searchLower !== '' ? true : (selectedCategory === 'all' || category === String(selectedCategory || '').toLowerCase());
    
        // Advanced filters (normalize comparisons)
        const advancedCategories = (advancedFilters.categories || []).map(c => String(c).toLowerCase());
        const advancedBrands = (advancedFilters.brands || []).map(b => String(b).toLowerCase());
        const advancedPriceMin = Number((advancedFilters.priceRange || [0, 500])[0]);
        const advancedPriceMax = Number((advancedFilters.priceRange || [0, 500])[1]);
        const advancedRating = Number(advancedFilters.rating || 0);

        // If user is actively searching, don't enforce advanced filters (search should be broad)
        const bypassAdvanced = searchLower !== '';

        const matchesAdvancedCategory = bypassAdvanced || advancedCategories.length === 0 || advancedCategories.includes(category);
        const matchesBrand = bypassAdvanced || advancedBrands.length === 0 || advancedBrands.includes(brand);
        const matchesRating = bypassAdvanced || rating >= advancedRating;
        const matchesPrice = bypassAdvanced || (price >= advancedPriceMin && price <= advancedPriceMax);

        return matchesSearch && matchesCategory && matchesAdvancedCategory && 
          matchesBrand && matchesRating && matchesPrice;
  });

  // Debug logging to help diagnose empty search results
  useEffect(() => {
    try {
      const s = String(debouncedSearchTerm || '').trim();
      const total = products.length;
      const matched = filteredProducts.length;
      console.debug('RecommendationEngine debug:', {
        searchTerm: s,
        selectedCategory,
        advancedFilters,
        totalProducts: total,
        matchedProducts: matched,
      });
      if (s) {
        // Log a few sample product match checks
        const samples = products.slice(0, 10).map(p => ({
          id: p._id || p.id,
          title: p.title || p.name,
          category: p.category,
          matchesSearch: (p.name || p.title || '').toLowerCase().includes(s.toLowerCase()) || (p.tags || []).some(t => t.toLowerCase().includes(s.toLowerCase())),
        }));
        console.debug('RecommendationEngine sample checks:', samples);
      }
    } catch (e) {
      // ignore
    }
  }, [debouncedSearchTerm, selectedCategory, advancedFilters, products, filteredProducts]);

  const categories = ['all', ...new Set(products.map(p => p.category).filter(Boolean))];

  // Compute local (client-side) recommendations when user picks a specific algorithm
  useEffect(() => {
    if (algorithmMode === 'auto') {
      setLocalRecommendations([]);
      return;
    }

    const runLocal = () => {
      if (algorithmMode === 'collaborative') {
        const collab = recommendationAlgorithms.collaborative(products, userBehavior || []);
        const enriched = collab.slice(0, 12).map(p => ({ ...p, explanation: generateExplanation(p, userPreferences, userBehavior) }));
        setLocalRecommendations(enriched.slice(0, 6));
        return;
      }

      // content-based/hybrid
      const content = recommendationAlgorithms.hybrid(products, userPreferences, userBehavior);
      const enriched = content.slice(0, 12).map(p => ({ ...p, explanation: generateExplanation(p, userPreferences, userBehavior) }));
      setLocalRecommendations(enriched.slice(0, 6));
    };

    try { runLocal(); } catch (e) { console.debug('Local recommendation failed', e); setLocalRecommendations([]); }
  }, [algorithmMode, products, userPreferences, userBehavior]);

  // Debug panel visibility
  const [showDebugPanel, setShowDebugPanel] = React.useState(true);

  const handleProductView = (product) => {
    setUserBehavior(prev => [...prev, {
      productId: product.id || product._id,
      category: product.category,
      tags: product.tags,
      action: 'view',
      timestamp: Date.now()
    }]);
  };

  const handleProductLike = async (product) => {
    const id = product?.id || product?._id;
    if (!id) return;

    const token = localStorage.getItem('token');
    if (token) {
      try {
        await api.post(`/user/like/${id}`);
        notifyProfileSaved('Like saved to profile');
      } catch (err) {
        console.debug('Failed to persist like:', err);
      }
    }

    setUserBehavior(prev => [...prev, {
      productId: id,
      category: product.category,
      tags: product.tags || [],
      action: 'like',
      timestamp: Date.now()
    }]);
    
    setUserPreferences(prev => ({
      ...prev,
      interests: [...new Set([...prev.interests, ...(product.tags || [])])]
    }));
  };

  const handleAddToCart = async (product) => {
    const id = product?.id || product?._id;
    setUserBehavior(prev => [...prev, {
      productId: id,
      category: product.category,
      tags: product.tags,
      action: 'add_to_cart',
      timestamp: Date.now()
    }]);

    // Persist purchase to backend
    const token = localStorage.getItem('token');
    if (token && id) {
      try {
        await api.post(`/user/cart/${id}`);
        notifyProfileSaved('Added to cart');
        // notify other components (badge in Navbar)
        window.dispatchEvent(new CustomEvent('cart-updated', { detail: { delta: 1 } }));
      } catch (err) {
        console.debug('Failed to persist purchase:', err);
      }
    }

    alert(`Added ${product.name || product.title} to cart!`);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      {/* On-screen debug panel (dev only) */}
      {showDebugPanel && (
        <div style={{position: 'fixed', right: 12, bottom: 12, zIndex: 60, width: 320, maxHeight: '40vh', overflow: 'auto'}}>
          <div className="bg-white border shadow-lg rounded-lg p-3 text-xs">
            <div className="flex items-center justify-between mb-2">
              <strong className="text-sm">Recommendation Debug</strong>
              <button onClick={() => setShowDebugPanel(false)} className="text-red-500 text-xs">Hide</button>
            </div>
            <div className="space-y-1">
              <div><strong>searchTerm:</strong> {String(searchTerm || '')}</div>
              <div><strong>debounced:</strong> {String(debouncedSearchTerm || '')}</div>
              <div><strong>selectedCategory:</strong> {String(selectedCategory)}</div>
              <div><strong>products:</strong> {products.length}</div>
              <div><strong>filtered:</strong> {filteredProducts.length}</div>
              <div><strong>advanced:</strong> {JSON.stringify(advancedFilters)}</div>
            </div>
          </div>
        </div>
      )}
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Smart Product Recommendations
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover products tailored to your unique preferences and behavior
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <UserPreferences 
              preferences={userPreferences}
              setPreferences={setUserPreferences}
              products={products}
            />
            <AdvancedFilters 
              filters={advancedFilters}
              onFiltersChange={setAdvancedFilters}
              products={products}
            />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Loading State */}
            {loading && (
              <div className="flex flex-col items-center justify-center py-24">
                <Loader className="animate-spin text-blue-500 mb-4" size={48} />
                <p className="text-lg text-gray-600">Loading products...</p>
              </div>
            )}

            {/* Error State */}
            {error && !loading && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg mb-8">
                <p className="font-semibold">Error</p>
                <p>{error}</p>
              </div>
            )}

            {/* Products Loaded */}
            {!loading && products.length > 0 && (
              <>
            {/* Search and Filters */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
              <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                {/* Search */}
                <div ref={searchBoxRef} className="relative flex-1 w-full">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search products or tags..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => setShowSearchHistory(true)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        saveSearchToHistory(searchTerm);
                        setShowSearchHistory(false);
                      }
                    }}
                    onBlur={() => {
                      // save the typed query when the input loses focus (short delay to allow suggestion click)
                      const t = (searchTerm || '').trim();
                      if (!t) {
                        setShowSearchHistory(false);
                        return;
                      }
                      setTimeout(() => {
                        // avoid duplicate save if already the most recent
                        try {
                          const raw = localStorage.getItem(SEARCH_HISTORY_KEY);
                          const arr = raw ? JSON.parse(raw) : [];
                          if (!Array.isArray(arr) || arr[0]?.toLowerCase() !== t.toLowerCase()) {
                            saveSearchToHistory(t);
                          }
                        } catch (e) {
                          saveSearchToHistory(t);
                        }
                        setShowSearchHistory(false);
                      }, 150);
                    }}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />

                  {showSearchHistory && filteredHistory.length > 0 && (
                    <div className="absolute top-[calc(100%+8px)] left-0 right-0 z-30 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                      {filteredHistory.map((item) => (
                        <button
                          key={item}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()} /* keep input focus so blur/save doesn't interfere */
                          onClick={() => {
                            setSearchTerm(item);
                            saveSearchToHistory(item);
                            setShowSearchHistory(false);
                          }}
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 text-gray-700 border-b last:border-b-0 border-gray-100"
                        >
                          {item}
                        </button>
                      ))}
                      <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
                        <button
                          type="button"
                          onClick={clearSearchHistoryAndPersist}
                          className="text-sm text-red-600 hover:text-red-700 font-medium"
                        >
                          Clear history
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Category Filter */}
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </option>
                  ))}
                </select>

                {/* View Mode Toggle */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-3 rounded-lg ${
                      viewMode === 'grid' 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    <Grid size={20} />
                  </button>
                </div>
              </div>
            </div>

            {/* Algorithm Selector */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Recommendations</h2>
                <div className="flex items-center gap-2">
                  <button onClick={() => setAlgorithmMode('auto')} className={`px-3 py-2 rounded-full text-sm font-medium ${algorithmMode==='auto' ? 'bg-blue-600 text-white' : 'bg-white border'}`}>Auto</button>
                  <button onClick={() => setAlgorithmMode('collaborative')} className={`px-3 py-2 rounded-full text-sm font-medium ${algorithmMode==='collaborative' ? 'bg-blue-600 text-white' : 'bg-white border'}`}>Collaborative</button>
                  <button onClick={() => setAlgorithmMode('content')} className={`px-3 py-2 rounded-full text-sm font-medium ${algorithmMode==='content' ? 'bg-blue-600 text-white' : 'bg-white border'}`}>Content</button>
                </div>
              </div>
            </div>

            {/* Recommendations Section */}
            {(algorithmMode === 'auto' ? recommendations : localRecommendations).length > 0 && (
              <section className="mb-12">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <h2 className="text-3xl font-bold text-gray-800">Recommended For You</h2>
                    {(algorithmMode === 'auto' && isPersonalized) && (
                      <span className="text-sm bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full font-semibold">
                        Personalized for you
                      </span>
                    )}
                    {algorithmMode === 'collaborative' && (
                      <span className="text-sm bg-blue-50 text-blue-800 px-2 py-1 rounded-full font-semibold">Collaborative</span>
                    )}
                    {algorithmMode === 'content' && (
                      <span className="text-sm bg-gray-100 text-gray-800 px-2 py-1 rounded-full font-semibold">Content</span>
                    )}
                  </div>
                  <span className="text-lg text-gray-600">{(algorithmMode==='auto' ? recommendations.length : localRecommendations.length)} products</span>
                </div>
                <div className={`grid gap-6 ${
                  viewMode === 'grid' 
                    ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' 
                    : 'grid-cols-1'
                }`}>
                  {(algorithmMode==='auto' ? recommendations : localRecommendations).map(product => (
                    <ProductCard
                      key={product._id || product.id}
                      product={product}
                      onLike={handleProductLike}
                      onView={handleProductView}
                      onAddToCart={handleAddToCart}
                      isRecommended={true}
                      explanation={product.explanation}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* All Products Section */}
            <section>
              <h2 className="text-3xl font-bold text-gray-800 mb-6">
                {searchTerm || selectedCategory !== 'all' ? 'Filtered Products' : 'All Products'}
              </h2>
              {filteredProducts.length > 0 ? (
                <div className={`grid gap-6 ${
                  viewMode === 'grid' 
                    ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' 
                    : 'grid-cols-1'
                }`}>
                  {filteredProducts.map(product => (
                    <ProductCard
                      key={product._id || product.id}
                      product={product}
                      onLike={handleProductLike}
                      onView={handleProductView}
                      onAddToCart={handleAddToCart}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg">No products found. Try adjusting your search or filters.</p>
                </div>
              )}
            </section>
              </>
            )}

            {/* No Products State */}
            {!loading && products.length === 0 && !error && (
              <div className="text-center py-24">
                <p className="text-gray-500 text-lg">No products available yet. Check back later!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecommendationEngine;