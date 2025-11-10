import React, { useState } from 'react';
import { Filter, X, Sliders } from 'lucide-react';

const AdvancedFilters = ({ filters, onFiltersChange, products }) => {
  const [isOpen, setIsOpen] = useState(false);

  const categories = [...new Set(products.map(p => p.category))];
  const brands = [...new Set(products.map(p => p.brand))];

  const handleFilterChange = (filterType, value) => {
    onFiltersChange(prev => ({
      ...prev,
      [filterType]: prev[filterType].includes(value)
        ? prev[filterType].filter(item => item !== value)
        : [...prev[filterType], value]
    }));
  };

  const clearFilters = () => {
    onFiltersChange({
      categories: [],
      brands: [],
      tags: [],
      priceRange: [0, 500],
      rating: 0
    });
  };

  return (
    <>
      {/* Mobile Filter Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2"
      >
        <Filter size={20} />
        Filters
      </button>

      {/* Filter Sidebar */}
      <div className={`
        fixed lg:static inset-0 bg-black bg-opacity-50 lg:bg-transparent z-50 transition-opacity
        ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none lg:pointer-events-auto'}
      `}>
        <div className={`
          absolute lg:relative right-0 top-0 h-full w-80 lg:w-full bg-white shadow-xl lg:shadow-none
          transform transition-transform ${isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
        `}>
          <div className="p-6 h-full overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Sliders size={20} />
                Advanced Filters
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="lg:hidden text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>

            {/* Price Range */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-700 mb-3">Price Range</h3>
              <input
                type="range"
                min="0"
                max="500"
                step="10"
                value={filters.priceRange[1]}
                onChange={(e) => onFiltersChange(prev => ({
                  ...prev,
                  priceRange: [0, parseInt(e.target.value)]
                }))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-sm text-gray-600 mt-1">
                <span>$0</span>
                <span>${filters.priceRange[1]}</span>
              </div>
            </div>

            {/* Categories */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-700 mb-3">Categories</h3>
              <div className="space-y-2">
                {categories.map(category => (
                  <label key={category} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.categories.includes(category)}
                      onChange={() => handleFilterChange('categories', category)}
                      className="rounded text-blue-500 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 capitalize">{category}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Brands */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-700 mb-3">Brands</h3>
              <div className="space-y-2">
                {brands.map(brand => (
                  <label key={brand} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.brands.includes(brand)}
                      onChange={() => handleFilterChange('brands', brand)}
                      className="rounded text-blue-500 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{brand}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Rating */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-700 mb-3">Minimum Rating</h3>
              <div className="flex gap-2">
                {[4, 3, 2, 1].map(rating => (
                  <button
                    key={rating}
                    onClick={() => onFiltersChange(prev => ({
                      ...prev,
                      rating: prev.rating === rating ? 0 : rating
                    }))}
                    className={`px-3 py-1 rounded-lg text-sm ${
                      filters.rating >= rating
                        ? 'bg-yellow-500 text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {rating}+ ★
                  </button>
                ))}
              </div>
            </div>

            {/* Clear Filters */}
            <button
              onClick={clearFilters}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg transition-colors font-medium"
            >
              Clear All Filters
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdvancedFilters;