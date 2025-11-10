import React, { useState } from 'react';
import ProductCard from './ProductCard';
import UserPreferences from './UserPreferences';
import { useRecommendation } from '../hooks/useRecommendation';
import { products } from '../data/products';
import { Filter, Grid, List, Search } from 'lucide-react';

const RecommendationSystem = () => {
  const [userPreferences, setUserPreferences] = useState({
    preferredCategories: [],
    interests: [],
    priceRange: [0, 500]
  });

  const [userBehavior, setUserBehavior] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const recommendations = useRecommendation(userPreferences, userBehavior);

  // Filter products based on search and category
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['all', ...new Set(products.map(p => p.category))];

  const handleProductView = (product) => {
    setUserBehavior(prev => [...prev, {
      productId: product.id,
      category: product.category,
      tags: product.tags,
      action: 'view',
      timestamp: Date.now()
    }]);
  };

  const handleProductLike = (product) => {
    setUserBehavior(prev => [...prev, {
      productId: product.id,
      category: product.category,
      tags: product.tags,
      action: 'like',
      timestamp: Date.now()
    }]);
  };

  const handleAddToCart = (product) => {
    setUserBehavior(prev => [...prev, {
      productId: product.id,
      category: product.category,
      tags: product.tags,
      action: 'add_to_cart',
      timestamp: Date.now()
    }]);
    alert(`Added ${product.name} to cart!`);
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-800 mb-4">
            Smart Product Recommendations
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover products tailored to your unique preferences and behavior
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <UserPreferences 
              preferences={userPreferences}
              setPreferences={setUserPreferences}
            />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
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
                      key={product.id}
                      product={product}
                      onLike={handleProductLike}
                      onView={handleProductView}
                      onAddToCart={handleAddToCart}
                      isRecommended={true}
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
                      key={product.id}
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecommendationSystem;