import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function PaymentFailure() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Try to extract orderId from referer or local storage if needed
  let orderId = null;
  try {
    const encodedData = searchParams.get('data');
    if (encodedData) {
      const decodedStr = atob(encodedData);
      const paymentData = JSON.parse(decodedStr);
      orderId = paymentData.transaction_uuid?.split('-')[0];
    }
  } catch (e) {
    console.error('Error extracting orderId from failure:', e);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-lg shadow-lg p-10 text-center max-w-md">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Payment Failed</h2>
        <p className="text-gray-600 mb-6">
          Your payment could not be completed. Please try again or choose a different payment method.
        </p>
        <div className="space-y-3">
          {orderId && (
            <button
              onClick={() => navigate(`/order/${orderId}`)}
              className="w-full py-3 bg-orange-500 text-white font-semibold rounded hover:bg-orange-600"
            >
              Retry Payment
            </button>
          )}
          <button
            onClick={() => navigate('/cart')}
            className="w-full py-3 bg-gray-200 text-gray-800 font-semibold rounded hover:bg-gray-300"
          >
            Back to Cart
          </button>
          <button
            onClick={() => navigate('/')}
            className="w-full py-3 bg-gray-100 text-gray-700 font-semibold rounded hover:bg-gray-200"
          >
            Go Home
          </button>
        </div>
      </div>
    </div>
  );
}
