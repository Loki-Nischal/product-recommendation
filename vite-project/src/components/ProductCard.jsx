import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Heart, ShoppingCart, Eye, Zap, Clock } from 'lucide-react';
import api from "../api/api";
import { notifyProfileSaved } from '../utils/profileToast';

const ProductCard = ({ 
  product, 
  onLike, 
  onView, 
  onAddToCart, 
  isRecommended = false,
  explanation = []
}) => {
  const navigate = useNavigate();
  const [isLiked, setIsLiked] = useState(() => {
    try {
      const id = product?._id || product?.id;
      if (!id) return false;
      const raw = localStorage.getItem('likedProductIds');
      if (!raw) return false;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) && parsed.includes(id);
    } catch (e) {
      return false;
    }
  });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  // If local cache is missing or empty, try to seed it from server so likes persist after refresh.
  React.useEffect(() => {
    let mounted = true;
    const seed = async () => {
      try {
        const raw = localStorage.getItem('likedProductIds');
        // if key exists and has values, don't fetch
        if (raw && raw !== '[]') return;
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await api.get('/user/profile');
        if (!mounted) return;
        if (res && res.success && res.data) {
          const liked = Array.isArray(res.data.likedProducts)
            ? res.data.likedProducts.map((p) => p._id || p.id).filter(Boolean)
            : [];
          try {
            localStorage.setItem('likedProductIds', JSON.stringify(liked));
          } catch (e) {}
          const id = product?._id || product?.id;
          if (id && liked.includes(id)) setIsLiked(true);
        }
      } catch (e) {
        // ignore
      }
    };
    seed();
    return () => { mounted = false; };
  }, [product]);

  const handleLike = async () => {
    const id = product._id || product.id;
    if (!id) return;

    const nextLiked = !isLiked;
    setIsLiked(nextLiked);

    try {
      const raw = localStorage.getItem('likedProductIds');
      const arr = raw ? JSON.parse(raw) : [];
      let next = Array.isArray(arr) ? [...arr] : [];
      if (nextLiked) {
        if (!next.includes(id)) next.unshift(id);
      } else {
        next = next.filter((x) => x !== id);
      }
      // cap to 100 ids
      if (next.length > 100) next = next.slice(0, 100);
      localStorage.setItem('likedProductIds', JSON.stringify(next));
    } catch (e) {
      // ignore localStorage errors
    }

    // call parent handler if provided, otherwise persist directly
    try {
      if (typeof onLike === 'function') {
        const res = onLike(product);
        if (res && typeof res.then === 'function') {
          await res;
        }
      } else {
        // fallback: call API directly so likes persist even when parent doesn't pass handler
        await api.post(`/user/like/${id}`);
        notifyProfileSaved('Like saved to profile');
      }
    } catch (err) {
      console.error('Failed to persist like:', err);
      setIsLiked(!nextLiked);
      try {
        // revert localStorage change
        const raw = localStorage.getItem('likedProductIds');
        const arr = raw ? JSON.parse(raw) : [];
        const ids = Array.isArray(arr) ? arr.filter((x) => x !== id) : [];
        localStorage.setItem('likedProductIds', JSON.stringify(ids));
      } catch (e) {}
      // surface a friendly message
      try { alert('Failed to update like. Please try again.'); } catch (e) {}
    }
  };

  const recordView = async (prod) => {
    try {
      if (!prod) return;
      const token = localStorage.getItem("token");
      if (!token) return;
      const id = prod._id || prod.id;
      if (!id) return;
      await api.post(`/user/view/${id}`);
      notifyProfileSaved('View saved to profile');
    } catch (err) {
      console.debug("Failed to record product view:", err?.message || err);
    }
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
    } flex flex-col h-full`}> 
      {/* Recommendation Crown */}
      {isRecommended && (
        <div className="absolute top-2 left-2 bg-linear-to-r from-blue-500 to-purple-600 text-white px-3 py-1 rounded-full text-xs font-bold z-10 flex items-center gap-1">
          <Zap size={12} />
          RECOMMENDED
        </div>
      )}

      {/* Product Image */}
      <div className="relative bg-gray-100 sm:h-48 h-44">
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

        {/* Quick Actions Overlay (full buttons with icon + label) */}
        <div className="absolute bottom-2 left-2 right-2 opacity-0 hover:opacity-100 transition-opacity duration-300">
          <div className="flex gap-2 justify-center">
            <button
              onClick={async () => {
                try {
                  await recordView(product);
                  if (typeof onView === 'function') onView(product);
                } catch (err) {
                  console.error('onView quick action failed', err);
                }
              }}
              className="flex-1 min-w-0 bg-white bg-opacity-90 text-gray-800 py-2 px-3 rounded-lg flex items-center justify-center gap-2 hover:bg-opacity-100 transition text-sm font-medium"
            >
              <Eye size={16} />
              <span className="truncate">View</span>
            </button>

            <button
              onClick={async () => {
                if (isAdding || product.stock === 0) return;
                try {
                  setIsAdding(true);
                  const res = onAddToCart && onAddToCart(product);
                  if (res && typeof res.then === 'function') await res;
                } catch (err) {
                  console.error('Add to cart quick action failed', err);
                } finally {
                  setIsAdding(false);
                }
              }}
              disabled={isAdding || product.stock === 0}
              className={`flex-1 min-w-0 py-2 px-3 rounded-lg flex items-center justify-center gap-2 text-sm font-medium ${
                product.stock === 0 ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : isAdding ? 'bg-blue-400 text-white cursor-wait' : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              {isAdding ? (
                <>
                  <div className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span className="truncate">Adding…</span>
                </>
              ) : (
                <>
                  <ShoppingCart size={16} />
                  <span className="truncate">Add</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Product Info */}
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-lg text-gray-800 line-clamp-2 flex-1 mr-2 break-words">{product.name || product.title}</h3>
          <div className="text-right">
            <span className="font-bold text-green-600 text-lg">Rs {(product.price || 0).toFixed(2)}</span>
          </div>
        </div>

        <p className="text-gray-600 text-sm mb-2 capitalize">{product.category || "Uncategorized"}</p>
        
        {/* Rating and Brand */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i}
                  size={14}
                  className={`${
                    i < Math.floor(product.rating || 0) 
                      ? 'text-yellow-400 fill-current' 
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="ml-2 text-sm text-gray-600">({(product.rating || 0).toFixed(1)})</span>
          </div>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
            {product.brand || "N/A"}
          </span>
        </div>

        {/* Features */}
        {product.features && product.features.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {product.features.slice(0, 2).map((feature, index) => (
              <span 
                key={index}
                className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs"
              >
                {feature}

              </span>            ))}
          </div>
        )}

        {/* Match Score for Recommendations */}
        {product.matchScore > 0 && (
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
        <div className="flex gap-2 flex-nowrap mt-auto">
          <button 
            onClick={async (e) => {
              // record view then call optional analytics/view handler
              try {
                await recordView(product);
              } catch (err) {
                console.debug('recordView failed', err);
              }
              try {
                if (typeof onView === 'function') onView(product);
              } catch (err) {
                console.error('onView handler failed', err);
              }
              // always navigate to product details
              const id = product._id || product.id;
              if (id) navigate(`/product/${id}`);
            }}
            className="flex-1 min-w-0 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm font-medium"
          >
            <Eye size={16} />
            Details
          </button>
          <button 
            onClick={async () => {
              if (isAdding || product.stock === 0) return;
              try {
                setIsAdding(true);
                const res = onAddToCart && onAddToCart(product);
                if (res && typeof res.then === 'function') await res;
              } catch (err) {
                console.error('Add to cart failed', err);
              } finally {
                setIsAdding(false);
              }
            }}
            disabled={product.stock === 0 || isAdding}
            className={`flex-1 min-w-0 py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm font-medium ${
              product.stock === 0 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : isAdding ? 'bg-blue-400 text-white opacity-90 cursor-wait' : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            {isAdding ? (
              <>
                <div className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span className="truncate">Adding…</span>
              </>
            ) : (
              <>
                <ShoppingCart size={16} />
                <span className="truncate">{product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;