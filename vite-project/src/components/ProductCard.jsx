import React, { useState } from 'react';
import { Star, Heart, ShoppingCart, Eye, Zap, Clock } from 'lucide-react';

const ProductCard = ({ 
  product, 
  onLike, 
  onView, 
  onAddToCart, 
  isRecommended = false,
  explanation = []
}) => {
  const [isLiked, setIsLiked] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleLike = () => {
    setIsLiked(!isLiked);
    onLike(product);
  };

  const getBadge = () => {
    if (product.isNew) return { text: 'NEW', color: 'bg-green-500' };
    if (product.stock < 10 && product.stock > 0) return { text: 'LOW STOCK', color: 'bg-orange-500' };
    if (product.rating >= 4.7) return { text: 'POPULAR', color: 'bg-purple-500' };
    return null;
  };

  const badge = getBadge();

  return (
    <div className={`bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl transform hover:-translate-y-1 ${
      isRecommended ? 'border-2 border-blue-500 relative' : 'border border-gray-200'
    }`}>
      {/* Recommendation Crown */}
      {isRecommended && (
        <div className="absolute top-2 left-2 bg-linear-to-r from-blue-500 to-purple-600 text-white px-3 py-1 rounded-full text-xs font-bold z-10 flex items-center gap-1">
          <Zap size={12} />
          RECOMMENDED
        </div>
      )}

      {/* Product Image */}
      <div className="relative h-48 bg-gray-100">
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        )}
        
        <img 
          src={imageError ? '/api/placeholder/300/300' : product.image}
          alt={product.name}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageError(true)}
        />
        
        {/* Badges */}
        <div className="absolute top-2 right-2 flex flex-col gap-1">
          {badge && (
            <span className={`${badge.color} text-white px-2 py-1 rounded-full text-xs font-semibold`}>
              {badge.text}
            </span>
          )}
          
          <button 
            onClick={handleLike}
            className="bg-white p-2 rounded-full shadow-md hover:bg-red-50 transition-colors"
          >
            <Heart 
              size={18} 
              className={isLiked ? "text-red-500 fill-current" : "text-gray-600"} 
            />
          </button>
        </div>

        {/* Quick Actions Overlay */}
        <div className="absolute bottom-2 left-2 right-2 opacity-0 hover:opacity-100 transition-opacity duration-300">
          <div className="flex gap-2 justify-center">
            <button 
              onClick={() => onView(product)}
              className="bg-black bg-opacity-70 text-white p-2 rounded-full hover:bg-opacity-90 transition-all"
            >
              <Eye size={16} />
            </button>
            <button 
              onClick={() => onAddToCart(product)}
              className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-all"
            >
              <ShoppingCart size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Product Info */}
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-lg text-gray-800 line-clamp-2 flex-1 mr-2">{product.name}</h3>
          <div className="text-right">
            <span className="font-bold text-green-600 text-lg">${product.price}</span>
          </div>
        </div>

        <p className="text-gray-600 text-sm mb-2 capitalize">{product.category}</p>
        
        {/* Rating and Brand */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i}
                  size={14}
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
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
            {product.brand}
          </span>
        </div>

        {/* Features */}
        {product.features && (
          <div className="flex flex-wrap gap-1 mb-3">
            {product.features.slice(0, 2).map((feature, index) => (
              <span 
                key={index}
                className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs"
              >
                {feature}
              </span>
            ))}
          </div>
        )}

        {/* Match Score for Recommendations */}
        {product.matchScore && (
          <div className="mb-3">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Personalized Match:</span>
              <span className="font-semibold text-blue-600">{Math.round(product.matchScore)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-linear-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-1000 ease-out" 
                style={{ width: `${product.matchScore}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Explanation for Recommendations */}
        {explanation.length > 0 && (
          <div className="mb-3 p-2 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-700 font-medium mb-1">Why we recommend this:</p>
            <ul className="text-xs text-blue-600 list-disc list-inside">
              {explanation.slice(0, 2).map((reason, index) => (
                <li key={index}>{reason}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Stock Information */}
        {product.stock !== undefined && (
          <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
            <span>
              {product.stock > 10 ? 'In Stock' : 
               product.stock > 0 ? `Only ${product.stock} left` : 'Out of Stock'}
            </span>
            {product.deliveryTime && (
              <span className="flex items-center gap-1">
                <Clock size={12} />
                {product.deliveryTime}
              </span>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button 
            onClick={() => onView(product)}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm font-medium"
          >
            <Eye size={16} />
            Details
          </button>
          <button 
            onClick={() => onAddToCart(product)}
            disabled={product.stock === 0}
            className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm font-medium ${
              product.stock === 0 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            <ShoppingCart size={16} />
            {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;