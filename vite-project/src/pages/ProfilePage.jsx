import React, { useEffect, useState } from 'react';
import API from '../api/api';
import ProfileHeader from '../components/ProfileHeader';
import UserActivityTabs from '../components/UserActivityTabs';

const ProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const res = await API.get('/user/profile');
      if (res.success) setProfile(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();

    // Listen for payment success event to refresh profile
    const handlePaymentSuccess = () => {
      console.log('Payment successful, refreshing profile...');
      fetchProfile();
    };
    window.addEventListener('payment-success', handlePaymentSuccess);

    return () => {
      window.removeEventListener('payment-success', handlePaymentSuccess);
    };
  }, []);

  if (loading) return <div className="p-6">Loading...</div>;
  if (!profile) return <div className="p-6">No profile found.</div>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <ProfileHeader profile={profile} onUpdate={setProfile} />
      <div className="mt-6">
        <UserActivityTabs profile={profile} refreshProfile={fetchProfile} />
      </div>
    </div>
  );
};

export default ProfilePage;
