import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';
import { Heart, Trash2 } from 'lucide-react';
import { notifyProfileSaved } from '../utils/profileToast';

export default function CartPage() {
  const [cartProducts, setCartProducts] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get('/user/profile');
        if (res && res.success && res.data) {
          const items = Array.isArray(res.data.cartProducts) ? res.data.cartProducts : [];
          setCartProducts(items);
          
          // Initialize quantities to 1
          const initialQty = {};
          items.forEach(p => {
            initialQty[p._id || p.id] = 1;
          });
          setQuantities(initialQty);
        }
      } catch (err) {
        setError('Failed to load cart');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allIds = new Set(cartProducts.map(p => p._id || p.id));
      setSelectedItems(allIds);
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleSelectItem = (id) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
  };

  const handleRemoveItem = async (id) => {
    try {
      console.log('Removing item from cart:', id);
      const response = await api.delete(`/user/cart/${id}`);
      console.log('Remove response:', response);
      
      setCartProducts(prev => {
        const newArr = prev.filter(p => (p._id || p.id) !== id);
        // notify other components of updated cart count
        window.dispatchEvent(new CustomEvent('cart-updated', { detail: { count: newArr.length } }));
        return newArr;
      });
      setSelectedItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
      notifyProfileSaved('Item removed from cart');
    } catch (err) {
      console.error('Failed to remove item:', err);
      console.error('Error details:', err.response?.data || err.message);
      alert('Failed to remove item: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedItems.size === 0) return;
    
    try {
      console.log('Deleting selected items:', Array.from(selectedItems));
      const deletePromises = Array.from(selectedItems).map(id => {
        console.log('Deleting item:', id);
        return api.delete(`/user/cart/${id}`);
      });
      
      await Promise.all(deletePromises);
      console.log('All items deleted successfully');
      
      setCartProducts(prev => {
        const newArr = prev.filter(p => !selectedItems.has(p._id || p.id));
        window.dispatchEvent(new CustomEvent('cart-updated', { detail: { count: newArr.length } }));
        return newArr;
      });
      setSelectedItems(new Set());
      notifyProfileSaved('Selected items removed');
    } catch (err) {
      console.error('Failed to remove items:', err);
      console.error('Error details:', err.response?.data || err.message);
      alert('Failed to remove some items: ' + (err.response?.data?.message || err.message));
    }
  };

  const updateQuantity = (id, change) => {
    const product = cartProducts.find(p => (p._id || p.id) === id);
    const maxQty = (product?.stock > 0) ? product.stock : 1;
    setQuantities(prev => {
      const newQty = Math.min(maxQty, Math.max(1, (prev[id] || 1) + change));
      return { ...prev, [id]: newQty };
    });
  };

  const handleLike = async (product) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      await api.post(`/user/like/${product._id || product.id}`);
      notifyProfileSaved('Added to wishlist');
    } catch (err) {
      console.debug('Failed to like:', err);
    }
  };

  // Calculate totals for selected items only
  const selectedProducts = cartProducts.filter(p => selectedItems.has(p._id || p.id));
  const subtotal = selectedProducts.reduce((sum, p) => {
    const qty = quantities[p._id || p.id] || 1;
    return sum + (p.price || 0) * qty;
  }, 0);
  const selectedItemCount = selectedProducts.reduce(
    (count, p) => count + (quantities[p._id || p.id] || 1),
    0
  );
  const shippingFeePerItem = 50;
  const shippingFee = selectedProducts.reduce((s, p) => s + (quantities[p._id || p.id] || 1) * shippingFeePerItem, 0);
  const total = subtotal + shippingFee;

  // Check if any selected item exceeds available stock
  const hasStockIssue = selectedProducts.some(p => {
    const qty = quantities[p._id || p.id] || 1;
    return (p.stock ?? 0) <= 0 || qty > (p.stock ?? 0);
  });

  if (loading) return <div className="p-8 text-center">Loading cart...</div>;
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Cart Section */}
        <div className="lg:col-span-2">
          {/* Header */}
          <div className="bg-white rounded-lg shadow p-4 mb-4 flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={cartProducts.length > 0 && selectedItems.size === cartProducts.length}
                onChange={handleSelectAll}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium">
                SELECT ALL ({cartProducts.length} ITEM{cartProducts.length !== 1 ? 'S' : ''})
              </span>
            </label>
            
            <button
              onClick={handleDeleteSelected}
              disabled={selectedItems.size === 0}
              className={`flex items-center gap-2 px-4 py-2 rounded ${
                selectedItems.size === 0
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-red-600 hover:bg-red-50'
              }`}
            >
              <Trash2 size={18} />
              DELETE
            </button>
          </div>

          {/* Cart Items */}
          {cartProducts.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-gray-600 mb-4">Your cart is empty</p>
              <button
                onClick={() => navigate('/recommendations')}
                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {cartProducts.map((product) => {
                const id = product._id || product.id;
                const qty = quantities[id] || 1;
                const isSelected = selectedItems.has(id);

                return (
                  <div
                    key={id}
                    className="bg-white rounded-lg shadow p-4 flex items-start gap-4"
                  >
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleSelectItem(id)}
                      className="w-5 h-5 mt-2"
                    />

                    {/* Product Image */}
                    <img
                      src={product.image || product.img || 'https://via.placeholder.com/150'}
                      alt={product.name || product.title}
                      className="w-24 h-24 object-cover rounded cursor-pointer"
                      onClick={() => navigate(`/product/${id}`)}
                    />

                    {/* Product Details */}
                    <div className="flex-1">
                      <h3 
                        className="font-semibold text-gray-800 mb-1 cursor-pointer hover:text-blue-600"
                        onClick={() => navigate(`/product/${id}`)}
                      >
                        {product.name || product.title}
                      </h3>
                      
                      {product.brand && (
                        <p className="text-sm text-gray-500">{product.brand}</p>
                      )}

                      {/* Stock badge */}
                      {(product.stock ?? 0) <= 0 ? (
                        <span className="inline-block mt-1 px-2 py-0.5 text-xs font-semibold bg-red-100 text-red-600 rounded">
                          Out of Stock
                        </span>
                      ) : (product.stock <= 5) ? (
                        <span className="inline-block mt-1 px-2 py-0.5 text-xs font-semibold bg-orange-100 text-orange-600 rounded">
                          Only {product.stock} left
                        </span>
                      ) : (
                        <span className="inline-block mt-1 px-2 py-0.5 text-xs text-green-600">
                          In Stock ({product.stock})
                        </span>
                      )}

                      <div className="mt-2 flex items-center gap-3">
                        <span className="text-xl font-bold text-red-600">
                          Rs. {product.price?.toLocaleString()}
                        </span>
                        {product.originalPrice && product.originalPrice > product.price && (
                          <span className="text-sm text-gray-400 line-through">
                            Rs. {product.originalPrice?.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quantity & Actions */}
                    <div className="flex flex-col items-end gap-3">
                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2 border rounded">
                        <button
                          onClick={() => updateQuantity(id, -1)}
                          className="px-3 py-1 hover:bg-gray-100"
                        >
                          −
                        </button>
                        <span className="px-4 py-1 border-x">{qty}</span>
                        <button
                          onClick={() => updateQuantity(id, 1)}
                          disabled={(product.stock ?? 0) <= 0 || qty >= (product.stock ?? 0)}
                          className={`px-3 py-1 ${
                            (product.stock ?? 0) <= 0 || qty >= (product.stock ?? 0)
                              ? 'text-gray-300 cursor-not-allowed'
                              : 'hover:bg-gray-100'
                          }`}
                        >
                          +
                        </button>
                      </div>
                      {qty >= (product.stock ?? 0) && (product.stock ?? 0) > 0 && (
                        <p className="text-xs text-orange-500 mt-1">Max stock reached</p>
                      )}

                      {/* Action Icons */}
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleLike(product)}
                          className="text-gray-400 hover:text-red-500"
                          title="Add to wishlist"
                        >
                          <Heart size={20} />
                        </button>
                        <button
                          onClick={() => handleRemoveItem(id)}
                          className="text-gray-400 hover:text-red-600"
                          title="Remove from cart"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6 sticky top-4">
            <h2 className="text-xl font-bold mb-4">Order Summary</h2>

            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal ({selectedItemCount} items)</span>
                <span>Rs. {subtotal.toFixed(0)}</span>
              </div>
              
              <div className="flex justify-between text-gray-600">
                <span>Shipping Fee</span>
                <span>Rs. {shippingFee.toFixed(0)}</span>
              </div>
            </div>

            <div className="border-t pt-4 mb-4">
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-red-600">Rs. {total.toFixed(0)}</span>
              </div>
            </div>

            <button
              disabled={selectedItems.size === 0 || hasStockIssue}
              onClick={() => {
                if (hasStockIssue) return;
                const checkoutItems = selectedProducts.map(p => ({
                  _id: p._id || p.id,
                  name: p.name || p.title,
                  price: p.price,
                  image: p.image || p.img,
                  quantity: quantities[p._id || p.id] || 1,
                }));
                navigate('/checkout', {
                  state: { items: checkoutItems, subtotal, shippingFee, total },
                });
              }}
              className={`w-full py-3 rounded font-semibold ${
                selectedItems.size === 0 || hasStockIssue
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-orange-500 text-white hover:bg-orange-600'
              }`}
            >
              {hasStockIssue && selectedItems.size > 0
                ? 'Some items are out of stock'
                : `PROCEED TO CHECKOUT(${selectedItems.size})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
