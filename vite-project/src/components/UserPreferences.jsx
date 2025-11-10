import React from 'react';
import { products } from '../data/products';

const UserPreferences = ({ preferences, setPreferences }) => {
  // Extract unique categories and tags from products
  const categories = [...new Set(products.map(p => p.category))];
  const allTags = [...new Set(products.flatMap(p => p.tags))];
  const popularTags = allTags.slice(0, 12); // Top 12 tags

  const toggleCategory = (category) => {
    setPreferences(prev => ({
      ...prev,
      preferredCategories: prev.preferredCategories.includes(category)
        ? prev.preferredCategories.filter(c => c !== category)
        : [...prev.preferredCategories, category]
    }));
  };

  const toggleInterest = (interest) => {
    setPreferences(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 h-fit sticky top-4">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Your Preferences</h2>
      
      {/* Categories Section */}
      <div className="mb-6">
        <h3 className="font-semibold text-lg mb-3 text-gray-700">Categories</h3>
        <div className="flex flex-wrap gap-2">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => toggleCategory(category)}
              className={`px-4 py-2 rounded-full transition-all ${
                preferences.preferredCategories.includes(category)
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Interests Section */}
      <div className="mb-6">
        <h3 className="font-semibold text-lg mb-3 text-gray-700">Interests</h3>
        <div className="flex flex-wrap gap-2">
          {popularTags.map(tag => (
            <button
              key={tag}
              onClick={() => toggleInterest(tag)}
              className={`px-3 py-1 rounded-full text-sm transition-all ${
                preferences.interests.includes(tag)
                  ? 'bg-green-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range Section */}
      <div className="mb-4">
        <h3 className="font-semibold text-lg mb-3 text-gray-700">
          Price Range: ${preferences.priceRange[0]} - ${preferences.priceRange[1]}
        </h3>
        <input
          type="range"
          min="0"
          max="500"
          step="10"
          value={preferences.priceRange[1]}
          onChange={(e) => setPreferences(prev => ({
            ...prev,
            priceRange: [0, parseInt(e.target.value)]
          }))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
        />
        <div className="flex justify-between text-sm text-gray-600 mt-1">
          <span>$0</span>
          <span>$500</span>
        </div>
      </div>

      {/* Reset Button */}
      <button
        onClick={() => setPreferences({
          preferredCategories: [],
          interests: [],
          priceRange: [0, 500]
        })}
        className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg transition-colors font-semibold"
      >
        Reset Preferences
      </button>
    </div>
  );
};

export default UserPreferences;