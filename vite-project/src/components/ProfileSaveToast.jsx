import React, { useState, useEffect, useRef } from 'react';

/**
 * Global toast that listens for 'profile-saved' custom events and briefly
 * shows a green "Saved to profile" banner at the bottom-right corner.
 *
 * Mount once in App.jsx — no props needed.
 */
const ProfileSaveToast = () => {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const timerRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      setMessage(e.detail?.message || 'Saved to profile');
      setVisible(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setVisible(false), 2200);
    };

    window.addEventListener('profile-saved', handler);
    return () => {
      window.removeEventListener('profile-saved', handler);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 9999,
        background: '#16a34a',
        color: '#fff',
        padding: '10px 20px',
        borderRadius: 8,
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        fontSize: 14,
        fontWeight: 600,
        transition: 'opacity 0.3s',
        opacity: visible ? 1 : 0,
      }}
    >
      {message}
    </div>
  );
};

export default ProfileSaveToast;
