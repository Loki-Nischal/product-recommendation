import React, { useState } from 'react';
import API from '../api/api';

const ProfileHeader = ({ profile, onUpdate }) => {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: profile.name || '',
    email: profile.email || '',
    phone: profile.phone || '',
    address: profile.address || '',
    bio: profile.bio || '',
  });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const save = async () => {
    try {
      const res = await API.put('/user/profile', form);
      if (res.success) {
        onUpdate(res.data);
        setEditing(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('image', file);
    try {
      // Let axios set the correct Content-Type and boundary for multipart requests
      const res = await API.post('/user/profile/image', fd);
      if (res.success) {
        onUpdate((p) => ({ ...p, profileImage: res.data.profileImage }));
      }
    } catch (err) {
      // API interceptor rejects with a normalized object { message, status, data }
      console.error('Upload error:', err);
      const msg = err?.message || err?.data?.message || 'Upload failed';
      alert(msg);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md flex gap-6 items-center">
      <div className="w-28 h-28 rounded-full bg-gray-100 overflow-hidden shrink-0">
        {(() => {
          const backendBase = (API.defaults && API.defaults.baseURL)
            ? String(API.defaults.baseURL).replace(/\/?api\/?$/, '')
            : (import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000').replace(/\/?api\/?$/, '');
          const imageSrc = profile?.profileImage
            ? (String(profile.profileImage).startsWith('http') ? profile.profileImage : `${backendBase}${profile.profileImage}`)
            : '/default-avatar.png';

          return (
            <img src={imageSrc} alt="avatar" className="w-full h-full object-cover" />
          );
        })()}
      </div>
      <div className="flex-1">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-semibold">{profile.name}</h2>
            <p className="text-sm text-gray-500">Member since: {new Date(profile.createdAt).toLocaleDateString()}</p>
            <p className="text-sm text-gray-600 mt-2">{profile.bio}</p>
          </div>
          <div className="flex flex-col gap-2">
            <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 bg-gray-100 rounded">
              Upload
              <input type="file" onChange={handleFile} className="hidden" />
            </label>
            <button
              onClick={() => setEditing((v) => !v)}
              className="px-4 py-2 bg-blue-600 text-white rounded"
            >
              {editing ? 'Cancel' : 'Edit'}
            </button>
          </div>
        </div>

        {editing && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            <input name="name" value={form.name} onChange={handleChange} className="p-2 border rounded" placeholder="Name" />
            <input name="email" value={form.email} onChange={handleChange} className="p-2 border rounded" placeholder="Email" />
            <input name="phone" value={form.phone} onChange={handleChange} className="p-2 border rounded" placeholder="Phone" />
            <input name="address" value={form.address} onChange={handleChange} className="p-2 border rounded" placeholder="Address" />
            <textarea name="bio" value={form.bio} onChange={handleChange} className="p-2 border rounded col-span-1 md:col-span-2" placeholder="Bio" />
            <div className="col-span-1 md:col-span-2 flex gap-2">
              <button onClick={save} className="px-4 py-2 bg-green-600 text-white rounded">Save</button>
              <button onClick={() => setEditing(false)} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
            </div>
          </div>
        )}
      </div>

      <div className="w-44 text-right text-sm text-gray-600">
        <div>Email: {profile.email}</div>
        <div>Phone: {profile.phone || '-'}</div>
        <div>Address: {profile.address || '-'}</div>
      </div>
    </div>
  );
};

export default ProfileHeader;
