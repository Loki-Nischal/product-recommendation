import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/api';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const encodedData = searchParams.get('data');

        console.log('All URL params:', Object.fromEntries(searchParams.entries()));
        console.log('encodedData:', encodedData);

        if (!encodedData) {
          setError('Missing payment data from eSewa');
          setVerifying(false);
          return;
        }

        // Decode to extract orderId from transaction_uuid
        const decodedStr = atob(encodedData);
        const paymentData = JSON.parse(decodedStr);
        console.log('Decoded payment data:', paymentData);
        
        // Extract orderId from transaction_uuid (format: orderId-timestamp)
        const orderId = paymentData.transaction_uuid?.split('-')[0];
        
        if (!orderId) {
          setError('Invalid transaction data');
          setVerifying(false);
          return;
        }

        const res = await api.post('/orders/verify-esewa', {
          encodedData,
          orderId,
        });

        if (res?.success) {
          setVerified(true);
          // Dispatch event to refresh profile if user is on profile page
          window.dispatchEvent(new CustomEvent('payment-success'));
        } else {
          setError(res?.message || 'Payment verification failed');
        }
      } catch (err) {
        console.error('Payment verification error:', err);
        setError(err?.data?.message || err?.message || 'Payment verification failed');
      } finally {
        setVerifying(false);
      }
    };

    verifyPayment();
  }, [searchParams]);

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-lg shadow-lg p-10 text-center max-w-md">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-500 mx-auto mb-6"></div>
          <h2 className="text-2xl font-semibold text-gray-800">Verifying Payment...</h2>
          <p className="text-gray-500 mt-2">Please wait while we confirm your payment with eSewa.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-lg shadow-lg p-10 text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Verification Failed</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/')}
              className="w-full py-3 bg-orange-500 text-white font-semibold rounded hover:bg-orange-600"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full py-3 bg-gray-200 text-gray-800 font-semibold rounded hover:bg-gray-300"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-lg shadow-lg p-10 text-center max-w-md">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Payment Successful!</h2>
        <p className="text-gray-600 mb-6">Your payment has been confirmed. Your order is now being processed.</p>
        <div className="space-y-3">
          <button
            onClick={async () => {
              try {
                const encodedData = searchParams.get('data');
                if (encodedData) {
                  const decodedStr = atob(encodedData);
                  const paymentData = JSON.parse(decodedStr);
                  const orderId = paymentData.transaction_uuid?.split('-')[0];
                  if (orderId) {
                    navigate(`/order/${orderId}`);
                    return;
                  }
                }
              } catch (e) {
                console.error('Error extracting orderId:', e);
              }
              navigate('/');
            }}
            className="w-full py-3 bg-green-500 text-white font-semibold rounded hover:bg-green-600"
          >
            View Order Details
          </button>
          <button
            onClick={() => navigate('/')}
            className="w-full py-3 bg-gray-200 text-gray-800 font-semibold rounded hover:bg-gray-300"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
}
