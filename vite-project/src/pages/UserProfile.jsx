import React from 'react';
import { useAuth } from '../context/AuthContext';

const UserProfile = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">User Profile</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-600">Name</label>
                <p className="mt-1 text-lg">{user?.name || 'Not provided'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Email</label>
                <p className="mt-1 text-lg">{user?.email}</p>
              </div>
            </div>
          </div>
          
          <div>
            <h2 className="text-xl font-semibold mb-4">Preferences</h2>
            <p className="text-gray-600">Your preference settings will appear here.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;