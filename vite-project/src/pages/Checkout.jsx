import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api/api';
import { notifyProfileSaved } from '../utils/profileToast';

const regions = [
  'Province 1', 'Madhesh Province', 'Bagmati Province',
  'Gandaki Province', 'Lumbini Province', 'Karnali Province', 'Sudurpashchim Province',
];

const cities = [
  'Kathmandu', 'Pokhara', 'Lalitpur', 'Bharatpur', 'Biratnagar',
  'Birgunj', 'Butwal', 'Dharan', 'Hetauda', 'Janakpur',
  'Nepalgunj', 'Itahari', 'Dhangadhi', 'Tulsipur', 'Damak',
];

export default function CheckoutPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // Passed from Cart via navigate state
  const { items = [], subtotal = 0, shippingFee = 0, total = 0 } = location.state || {};

  const [form, setForm] = useState({
    fullName: '',
    region: '',
    phoneNumber: '',
    city: '',
    address: '',
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const { user, isAuthReady, isLoggedIn } = useAuth();

  // Auto-fill form when user is authenticated and auth has been initialized.
  useEffect(() => {
    if (!isAuthReady) return;
    if (!isLoggedIn || !user) return;

    setForm((prev) => ({
      fullName: prev.fullName || user.name || '',
      region: prev.region || prev.region || '',
      phoneNumber: prev.phoneNumber || user.phone || '',
      city: prev.city || '',
      address: prev.address || user.address || '',
    }));
  }, [isAuthReady, isLoggedIn, user]);

  // If no items, redirect back
  if (!items.length) {
    return (
      <div className="max-w-3xl mx-auto p-8 text-center">
        <p className="text-gray-600 mb-4">No items to checkout.</p>
        <button
          onClick={() => navigate('/cart')}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
        >
          Back to Cart
        </button>
      </div>
    );
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
  };

  const validate = () => {
    const errs = {};
    if (!form.fullName.trim()) errs.fullName = 'Full name is required';
    if (!form.region) errs.region = 'Please choose your region';
    if (!form.phoneNumber.trim()) errs.phoneNumber = 'Phone number is required';
    if (!form.city) errs.city = 'Please choose your city';
    if (!form.address.trim()) errs.address = 'Address is required';
    return errs;
  };

  const handleSave = async () => {
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    try {
      const orderPayload = {
        items: items.map((item) => ({
          product: item._id || item.id,
          name: item.name || item.title,
          price: item.price,
          quantity: item.quantity,
          image: item.image || item.img || '',
        })),
        deliveryInfo: {
          fullName: form.fullName,
          region: form.region,
          phoneNumber: form.phoneNumber,
          city: form.city,
          address: form.address,
        },
        subtotal,
        shippingFee,
        total,
      };

      const res = await api.post('/orders', orderPayload);

      // Update cart badge
      window.dispatchEvent(new CustomEvent('cart-updated', { detail: { count: 0 } }));

      notifyProfileSaved('Order placed successfully!');
      const orderId = res?.data?._id || res?._id;
      if (orderId) {
        navigate(`/order/${orderId}`);
      } else {
        navigate('/cart');
      }
    } catch (err) {
      console.error('Order error:', err);
      alert('Failed to place order: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Delivery Information Form */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6 md:p-8">
          <h2 className="text-2xl font-bold mb-6">Delivery Information</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-blue-600 mb-1">Full name</label>
              <input
                type="text"
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                placeholder="Enter your first and last name"
                className={`w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                  errors.fullName ? 'border-red-400' : 'border-gray-300'
                }`}
              />
              {errors.fullName && <p className="text-xs text-red-500 mt-1">{errors.fullName}</p>}
            </div>

            {/* Region */}
            <div>
              <label className="block text-sm font-medium text-blue-600 mb-1">Region</label>
              <select
                name="region"
                value={form.region}
                onChange={handleChange}
                className={`w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                  errors.region ? 'border-red-400' : 'border-gray-300'
                }`}
              >
                <option value="">Please choose your region</option>
                {regions.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              {errors.region && <p className="text-xs text-red-500 mt-1">{errors.region}</p>}
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-sm font-medium text-blue-600 mb-1">Phone Number</label>
              <input
                type="text"
                name="phoneNumber"
                value={form.phoneNumber}
                onChange={handleChange}
                placeholder="Please enter your phone number"
                className={`w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                  errors.phoneNumber ? 'border-red-400' : 'border-gray-300'
                }`}
              />
              {errors.phoneNumber && <p className="text-xs text-red-500 mt-1">{errors.phoneNumber}</p>}
            </div>

            {/* City */}
            <div>
              <label className="block text-sm font-medium text-blue-600 mb-1">City</label>
              <select
                name="city"
                value={form.city}
                onChange={handleChange}
                className={`w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                  errors.city ? 'border-red-400' : 'border-gray-300'
                }`}
              >
                <option value="">Please choose your city</option>
                {cities.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              {errors.city && <p className="text-xs text-red-500 mt-1">{errors.city}</p>}
            </div>

            {/* Address - full width */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-blue-600 mb-1">Address</label>
              <input
                type="text"
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="For Example: House# 123, Street# 123, ABC Road"
                className={`w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                  errors.address ? 'border-red-400' : 'border-gray-300'
                }`}
              />
              {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address}</p>}
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-center mt-8">
            <button
              onClick={handleSave}
              disabled={saving}
              className={`px-12 py-3 rounded font-semibold text-white ${
                saving
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-orange-500 hover:bg-orange-600'
              }`}
            >
              {saving ? 'Placing Order...' : 'SAVE'}
            </button>
          </div>
        </div>

        {/* Order Detail Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6 sticky top-4">
            <h3 className="text-lg font-bold text-orange-700 mb-2">Invoice and Contact Info</h3>
            <hr className="mb-4" />

            <h3 className="text-lg font-bold mb-3">Order Detail</h3>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-gray-700">
                <span>Items Total ({items.reduce((s, i) => s + i.quantity, 0)} Items)</span>
                <span>Rs. {subtotal.toLocaleString()}</span>
              </div>

              <div className="flex justify-between text-gray-700">
                <span>Delivery Fee</span>
                <span>Rs. {shippingFee.toLocaleString()}</span>
              </div>
            </div>

            <hr className="mb-4" />

            <div className="flex justify-between text-lg font-bold mb-1">
              <span>Total:</span>
              <span className="text-green-600">Rs. {total.toLocaleString()}</span>
            </div>
            <p className="text-xs text-gray-400 text-right mb-4">All taxes included</p>

            <button
              onClick={handleSave}
              disabled={saving}
              className={`w-full py-3 rounded font-semibold text-white ${
                saving
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gray-500 hover:bg-gray-600'
              }`}
            >
              {saving ? 'Processing...' : 'Proceed to Pay'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
