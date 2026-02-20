import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/api';

const ESEWA_TEST_URL = 'https://rc-epay.esewa.com.np/api/epay/main/v2/form';
const PRODUCT_CODE = 'EPAYTEST';

export default function OrderDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [order, setOrder] = useState(null);
  const [payingEsewa, setPayingEsewa] = useState(false);

  useEffect(() => {
    let mounted = true;
    const loadOrder = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/orders/${id}`);
        if (mounted) setOrder(res?.data || null);
      } catch (err) {
        if (mounted) setError(err?.data?.message || err?.message || 'Failed to load order');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadOrder();
    return () => {
      mounted = false;
    };
  }, [id]);

  const handleEsewaPayment = async () => {
    if (!order) return;
    setPayingEsewa(true);
    try {
      const transaction_uuid = `${order._id}-${Date.now()}`;
      const total_amount = order.total;

      // Get signature from backend
      const sigRes = await api.post('/orders/generate-signature', {
        total_amount,
        transaction_uuid,
        product_code: PRODUCT_CODE,
      });

      const { signature, signed_field_names } = sigRes;

      // Build and submit form to eSewa
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = ESEWA_TEST_URL;

      const fields = {
        amount: order.subtotal,
        tax_amount: 0,
        total_amount,
        transaction_uuid,
        product_code: PRODUCT_CODE,
        product_service_charge: 0,
        product_delivery_charge: order.shippingFee || 0,
        success_url: `${window.location.origin}/payment/success`,
        failure_url: `${window.location.origin}/payment/failure`,
        signed_field_names,
        signature,
      };

      Object.entries(fields).forEach(([key, value]) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = value;
        form.appendChild(input);
      });

      document.body.appendChild(form);
      form.submit();
    } catch (err) {
      console.error('eSewa payment error:', err);
      setPayingEsewa(false);
      alert('Failed to initiate payment. Please try again.');
    }
  };

  if (loading) return <div className="p-8 text-center">Loading order...</div>;
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;
  if (!order) return <div className="p-8 text-center">Order not found</div>;

  const items = Array.isArray(order.items) ? order.items : [];
  const delivery = order.deliveryInfo || {};

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-lg shadow p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-2xl font-semibold">Shipping Address</h2>
              {/* <button
                onClick={() => navigate('/checkout')}
                className="text-blue-600 text-sm font-medium hover:underline"
              >
                EDIT
              </button> */}
            </div>
            <p className="text-lg font-medium text-gray-800">
              {delivery.fullName} {delivery.phoneNumber ? `  ${delivery.phoneNumber}` : ''}
            </p>
            <p className="text-gray-700 mt-2">
              {delivery.address}, {delivery.city}, {delivery.region}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-semibold">Package 1 of 1</h3>
              <span className="text-gray-700 font-medium">Shipped by Kathmandu CENTER</span>
            </div>

            <div className="mt-4 mb-6">
              <p className="text-sm font-medium mb-2">Delivery or Pickup</p>
              <div className="border border-cyan-500 rounded-md p-4 max-w-xs">
                <p className="text-2xl text-gray-800">Rs. {Number(order.shippingFee || 0).toLocaleString()}</p>
                <p className="text-gray-700 mt-1">Standard Delivery</p>
            
              </div>
            </div>

            <div className="space-y-4">
              {items.map((item, idx) => {
                const itemId = item.product?._id || item.product || `${idx}`;
                return (
                  <div key={itemId} className="flex items-start gap-4 border-t pt-4 first:border-t-0 first:pt-0">
                    <img
                      src={item.image || 'https://via.placeholder.com/90'}
                      alt={item.name}
                      className="w-20 h-20 object-cover rounded"
                    />
                    <div className="flex-1">
                      <p className="text-2xl text-gray-900 leading-tight">{item.name}</p>
                      <p className="text-gray-500 mt-1">Qty: {item.quantity || 1}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-orange-600 text-3xl">Rs. {Number(item.price || 0).toLocaleString()}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6 sticky top-4">
            <h3 className="text-2xl font-bold mb-4">Invoice and Contact Info</h3>
            <h4 className="text-2xl font-semibold mb-4">Order Detail</h4>

            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-lg text-gray-700">
                <span>Items Total ({items.reduce((sum, item) => sum + (item.quantity || 1), 0)} Items)</span>
                <span>Rs. {Number(order.subtotal || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-lg text-gray-700">
                <span>Delivery Fee</span>
                <span>Rs. {Number(order.shippingFee || 0).toLocaleString()}</span>
              </div>
            </div>

            <div className="border-t pt-4 mb-4">
              <div className="flex justify-between text-3xl font-semibold">
                <span>Total:</span>
                <span className="text-orange-600">Rs. {Number(order.total || 0).toLocaleString()}</span>
              </div>
              <p className="text-gray-500 text-sm mt-2 text-right">All taxes included</p>
            </div>

            <button
              onClick={handleEsewaPayment}
              disabled={payingEsewa || order.paymentStatus === 'paid'}
              className={`w-full py-3 text-white text-xl font-semibold rounded ${
                order.paymentStatus === 'paid'
                  ? 'bg-green-500 cursor-not-allowed'
                  : 'bg-orange-500 hover:bg-orange-600'
              }`}
            >
              {order.paymentStatus === 'paid'
                ? '✓ Paid'
                : payingEsewa
                ? 'Redirecting to eSewa...'
                : 'Pay with Esewa'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
