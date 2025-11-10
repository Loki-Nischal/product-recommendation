import React from 'react';
import { useParams } from 'react-router-dom';

const ProductDetails = () => {
  const { id } = useParams();
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold mb-4">Product Details</h1>
          <p className="text-gray-600">Product ID: {id}</p>
          <p className="mt-4">Product details page coming soon...</p>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;