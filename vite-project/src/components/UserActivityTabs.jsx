import React, { useState, useEffect, useRef } from 'react';
import ProductCard from './ProductCard';
import API from '../api/api';
import { notifyProfileSaved } from '../utils/profileToast';

const TabButton = ({ active, onClick, children }) => (
  <button onClick={onClick} className={`px-4 py-2 rounded ${active ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>
    {children}
  </button>
);

const UserActivityTabs = ({ profile, refreshProfile }) => {
  const [tab, setTab] = useState('liked');

  // optimistic local copies of lists (initialize from profile)
  const [localLiked, setLocalLiked] = useState(() => profile?.likedProducts || []);
  const [localViewed, setLocalViewed] = useState(() => profile?.viewedProducts || []);
  const [localSearchHistory, setLocalSearchHistory] = useState(() => {
    try {
      if (profile?.searchHistory && profile.searchHistory.length) return profile.searchHistory;
      const raw = localStorage.getItem('productSearchHistory');
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  });

  const pendingLikeRef = useRef(new Set());
  const pendingViewRef = useRef(new Set());

  // keep local copies in sync when profile prop changes
  useEffect(() => {
    setLocalLiked(profile?.likedProducts || []);
    setLocalViewed(profile?.viewedProducts || []);
    if (profile?.searchHistory && profile.searchHistory.length) {
      setLocalSearchHistory(profile.searchHistory);
    }
  }, [profile]);

  // listen to cross-tab storage updates for search history and liked/viewed ids
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'productSearchHistory') {
        try {
          const parsed = e.newValue ? JSON.parse(e.newValue) : [];
          setLocalSearchHistory(Array.isArray(parsed) ? parsed : []);
        } catch (err) {
          // ignore
        }
      }
      if (e.key === 'likedProductIds') {
        try {
          const parsed = e.newValue ? JSON.parse(e.newValue) : [];
          // map ids to minimal product objects when possible
          const ids = Array.isArray(parsed) ? parsed : [];
          setLocalLiked((curr) => {
            const existingById = new Map(curr.map((p) => [(p._id || p.id), p]));
            const next = ids.map((id) => existingById.get(id) || { _id: id });
            return next;
          });
        } catch (err) {}
      }
      if (e.key === 'viewedProductIds') {
        try {
          const parsed = e.newValue ? JSON.parse(e.newValue) : [];
          const ids = Array.isArray(parsed) ? parsed : [];
          setLocalViewed((curr) => {
            const existingById = new Map(curr.map((p) => [(p._id || p.id), p]));
            const next = ids.map((id) => existingById.get(id) || { _id: id });
            return next;
          });
        } catch (err) {}
      }
    };

    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const handleLike = async (product) => {
    const id = product._id || product.id;
    if (!id) return;

    // optimistic update
    const wasLiked = localLiked.some((p) => (p._id || p.id) === id);
    const prev = localLiked;
    const nextLiked = wasLiked ? prev.filter((p) => (p._id || p.id) !== id) : [product, ...prev];
    setLocalLiked(nextLiked);

    // keep a simple id cache in localStorage for other tabs/components
    try {
      const raw = localStorage.getItem('likedProductIds');
      const arr = raw ? JSON.parse(raw) : [];
      const ids = Array.isArray(arr) ? [...arr] : [];
      if (!wasLiked) {
        if (!ids.includes(id)) ids.unshift(id);
      } else {
        const idx = ids.indexOf(id);
        if (idx >= 0) ids.splice(idx, 1);
      }
      localStorage.setItem('likedProductIds', JSON.stringify(ids.slice(0, 100)));
    } catch (e) {}

    // send to server
    pendingLikeRef.current.add(id);
    try {
      await API.post(`/user/like/${id}`);
      notifyProfileSaved('Like saved to profile');
      // on success, optionally refresh full profile in background
      refreshProfile();
    } catch (err) {
      // revert optimistic change
      console.error('Failed to like product:', err);
      setLocalLiked(prev);
      try {
        // revert localStorage change
        const raw = localStorage.getItem('likedProductIds');
        const arr = raw ? JSON.parse(raw) : [];
        const ids = Array.isArray(arr) ? arr.filter((x) => x !== id) : [];
        localStorage.setItem('likedProductIds', JSON.stringify(ids));
      } catch (e) {}
      alert('Failed to update like. Please try again.');
    } finally {
      pendingLikeRef.current.delete(id);
    }
  };

  const handleView = async (product) => {
    const id = product._id || product.id;
    if (!id) return;

    const prev = localViewed;
    // remove duplicate then add to front
    const nextViewed = [{ _id: id, ...(product || {}) }, ...prev.filter((p) => (p._id || p.id) !== id)].slice(0, 50);
    setLocalViewed(nextViewed);

    try {
      const raw = localStorage.getItem('viewedProductIds');
      const arr = raw ? JSON.parse(raw) : [];
      const ids = Array.isArray(arr) ? [...arr] : [];
      const idx = ids.indexOf(id);
      if (idx >= 0) ids.splice(idx, 1);
      ids.unshift(id);
      localStorage.setItem('viewedProductIds', JSON.stringify(ids.slice(0, 50)));
    } catch (e) {}

    pendingViewRef.current.add(id);
    try {
      await API.post(`/user/view/${id}`);
      notifyProfileSaved('View saved to profile');
      refreshProfile();
    } catch (err) {
      console.error('Failed to record view:', err);
      setLocalViewed(prev);
      try {
        const raw = localStorage.getItem('viewedProductIds');
        const arr = raw ? JSON.parse(raw) : [];
        const ids = Array.isArray(arr) ? arr.filter((x) => x !== id) : [];
        localStorage.setItem('viewedProductIds', JSON.stringify(ids));
      } catch (e) {}
      // don't alert on view failures to avoid spam; log only
    } finally {
      pendingViewRef.current.delete(id);
    }
  };

  const handleAddToCart = async (product) => {
    const id = product._id || product.id;
    if (!id) return;
    try {
      await API.post(`/user/cart/${id}`);
      notifyProfileSaved('Added to cart');
      // notify other components (badge) and refresh profile
      window.dispatchEvent(new CustomEvent('cart-updated', { detail: { delta: 1 } }));
      refreshProfile();
    } catch (err) {
      console.error('Failed to record purchase:', err);
    }
  };

  const renderProducts = (items) => {
    if (!items || items.length === 0) return <div className="p-6 text-gray-500">No items.</div>;

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {items.map((p) => (
          <ProductCard key={p._id || p.id} product={p} onLike={handleLike} onView={handleView} onAddToCart={handleAddToCart} />
        ))}
      </div>
    );
  };

  

  const clearLocalSearchHistory = async () => {
    try {
      localStorage.removeItem('productSearchHistory');
    } catch (e) {
      // ignore
    }
    setLocalSearchHistory([]);

    // clear server-side saved history when logged in
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await API.post('/user/search/clear');
        notifyProfileSaved('Search history cleared');
        // refresh profile so UI shows server state
        if (typeof refreshProfile === 'function') refreshProfile();
      }
    } catch (err) {
      console.debug('Failed to clear server-side search history from UserActivityTabs:', err);
    }
  };

  return (
    <div className="bg-white rounded p-4 shadow">
      <div className="flex gap-2 mb-4">
        <TabButton active={tab === 'liked'} onClick={() => setTab('liked')}>Liked Products</TabButton>
        <TabButton active={tab === 'viewed'} onClick={() => setTab('viewed')}>Viewed Products</TabButton>
        <TabButton active={tab === 'purchased'} onClick={() => setTab('purchased')}>Purchased</TabButton>
        <TabButton active={tab === 'search'} onClick={() => setTab('search')}>Search History</TabButton>
      </div>

      <div>
        {tab === 'liked' && renderProducts(localLiked || [])}
        {tab === 'viewed' && renderProducts(localViewed || [])}
        {tab === 'purchased' && renderProducts(profile.purchasedProducts || [])}
        {tab === 'search' && (
          <div className="p-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold mb-2">Recent Searches</h4>
              <button
                type="button"
                onClick={clearLocalSearchHistory}
                className="text-sm text-red-600 hover:underline"
              >
                Clear history
              </button>
            </div>

            <ul className="list-disc list-inside text-gray-700">
              {(localSearchHistory && localSearchHistory.length > 0
                ? localSearchHistory
                : (profile.searchHistory || [])
              ).map((q, i) => (
                <li key={i} className="py-1">{q}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserActivityTabs;
