import React, { useState, useEffect } from 'react';
import ProductCard from './ProductCard';
import UserPreferences from './UserPreferences';
import AdvancedFilters from './AdvancedFilters';
import { useRecommendation } from '../hooks/useRecommendation';
import { useDebounce } from '../hooks/useDebounce';
import api from '../api/api';
import { Filter, Grid, List, Search, Loader } from 'lucide-react';

const RecommendationEngine = () => {
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
  const [viewMode, setViewMode] = useState('grid');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  const [advancedFilters, setAdvancedFilters] = useState({
    categories: [],
    brands: [],
    tags: [],
    priceRange: [0, 500],
    rating: 0
  });

  // Fetch products from backend
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get('/products');
        // Response is now { success: true, products: [...] } from the interceptor
        const fetchedProducts = response.products || [];
        setProducts(Array.isArray(fetchedProducts) ? fetchedProducts : []);
      } catch (err) {
        console.error('Error fetching products:', err);
        setError('Failed to load products. Please try again later.');
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const recommendations = useRecommendation(products, userPreferences, userBehavior);

  // Filter products based on search, category, and advanced filters
  const filteredProducts = products.filter(product => {
    // Safe property access
    const name = (product.name || product.title || '').toLowerCase();
    const title = (product.title || product.name || '').toLowerCase();
    const category = product.category || '';
    const brand = product.brand || '';
    const rating = product.rating || 0;
    const price = product.price || 0;
    const tags = product.tags || [];

    // Search matching
    const searchLower = debouncedSearchTerm.toLowerCase();
    const matchesSearch = debouncedSearchTerm === '' ||
                         name.includes(searchLower) ||
                         title.includes(searchLower) ||
                         tags.some(tag => tag.toLowerCase().includes(searchLower));

    // Category matching
    const matchesCategory = selectedCategory === 'all' || category === selectedCategory;
    
    // Advanced filters
    const matchesAdvancedCategory = advancedFilters.categories.length === 0 || 
                                   advancedFilters.categories.includes(category);
    const matchesBrand = advancedFilters.brands.length === 0 || 
                        advancedFilters.brands.includes(brand);
    const matchesRating = rating >= advancedFilters.rating;
    const matchesPrice = price >= advancedFilters.priceRange[0] && 
                        price <= advancedFilters.priceRange[1];

    return matchesSearch && matchesCategory && matchesAdvancedCategory && 
           matchesBrand && matchesRating && matchesPrice;
  });

  const categories = ['all', ...new Set(products.map(p => p.category).filter(Boolean))];

  const handleProductView = (product) => {
    setUserBehavior(prev => [...prev, {
      productId: product.id || product._id,
      category: product.category,
      tags: product.tags,
      action: 'view',
      timestamp: Date.now()
    }]);
  };

  const handleProductLike = (product) => {
    setUserBehavior(prev => [...prev, {
      productId: product.id || product._id,
      category: product.category,
      tags: product.tags || [],
      action: 'like',
      timestamp: Date.now()
    }]);
    
    // Also add product tags to user interests
    setUserPreferences(prev => ({
      ...prev,
      interests: [...new Set([...prev.interests, ...(product.tags || [])])]
    }));
  };

  const handleAddToCart = (product) => {
    setUserBehavior(prev => [...prev, {
      productId: product.id || product._id,
      category: product.category,
      tags: product.tags,
      action: 'add_to_cart',
      timestamp: Date.now()
    }]);
    alert(`Added ${product.name || product.title} to cart!`);
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 py-8">
      <div className="container mx-auto px-4">
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
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search products or tags..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
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
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-3 rounded-lg ${
                      viewMode === 'list' 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    <List size={20} />
                  </button>
                </div>
              </div>
            </div>

            {/* Recommendations Section */}
            {recommendations.length > 0 && (
              <section className="mb-12">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-3xl font-bold text-gray-800">
                    Recommended For You
                  </h2>
                  <span className="text-lg text-gray-600">
                    {recommendations.length} products matched
                  </span>
                </div>
                <div className={`grid gap-6 ${
                  viewMode === 'grid' 
                    ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' 
                    : 'grid-cols-1'
                }`}>
                  {recommendations.map(product => (
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