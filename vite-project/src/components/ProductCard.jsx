import React from 'react';
import { Star, Heart, ShoppingCart, Eye } from 'lucide-react';

const ProductCard = ({ 
  product, 
  onLike, 
  onView, 
  onAddToCart, 
  isRecommended = false 
}) => {
  return (
    <div className={`bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-105 ${
      isRecommended ? 'border-2 border-blue-500' : 'border border-gray-200'
    }`}>
      {/* Product Image */}
      <div className="relative">
        <img 
          src={product.image} 
          alt={product.name}
          className="w-full h-48 object-cover"
        />
        <div className="absolute top-3 right-3 flex gap-2">
          <button 
            onClick={() => onLike(product)}
            className="bg-white p-2 rounded-full shadow-md hover:bg-red-50 transition-colors"
          >
            <Heart 
              size={18} 
              className={product.isLiked ? "text-red-500 fill-current" : "text-gray-600"} 
            />
          </button>
          {isRecommended && (
            <span className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
              Recommended
            </span>
          )}
        </div>
      </div>

      {/* Product Info */}
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-lg text-gray-800">{product.name}</h3>
          <span className="font-bold text-green-600 text-lg">${product.price}</span>
        </div>

        <p className="text-gray-600 text-sm mb-2 capitalize">{product.category}</p>
        
        {/* Rating */}
        <div className="flex items-center mb-3">
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <Star 
                key={i}
                size={16}
                className={`${
                  i < Math.floor(product.rating) 
                    ? 'text-yellow-400 fill-current' 
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          <span className="ml-2 text-sm text-gray-600">({product.rating})</span>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mb-3">
          {product.tags.slice(0, 3).map(tag => (
            <span 
              key={tag}
              className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Match Score for Recommendations */}
        {product.matchScore && (
          <div className="mb-3">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Match:</span>
              <span className="font-semibold text-blue-600">{Math.round(product.matchScore)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-linear-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500" 
                style={{ width: `${product.matchScore}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button 
            onClick={() => onView(product)}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            <Eye size={16} />
            View
          </button>
          <button 
            onClick={() => onAddToCart(product)}
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            <ShoppingCart size={16} />
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;