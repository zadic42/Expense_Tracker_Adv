import React, { useState, useEffect } from 'react';
import { User, Lock, Camera, Plus, Edit2, Trash2, Star, CreditCard, Building } from 'lucide-react';
import { userAPI, uploadAPI } from '../services/api';
import { useToast } from '../hooks/useToast';
import { useTheme } from '../contexts/ThemeContext';

export default function SettingsDashboard() {
  const { showSuccess, showError } = useToast();
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    profilePicture: ''
  });
  
  const [passwordData, setPasswordData] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setFetchLoading(true);
      const response = await userAPI.getProfile();
      const user = response.data;
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        profilePicture: user.profilePicture || ''
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      showError('Failed to load profile');
    } finally {
      setFetchLoading(false);
    }
  };

  const handleProfileUpdate = async () => {
    try {
      setLoading(true);
      await userAPI.updateProfile(profileData);
      showSuccess('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      showError(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.new !== passwordData.confirm) {
      showError('New passwords do not match!');
      return;
    }
    if (!passwordData.current || !passwordData.new) {
      showError('Please fill in all password fields!');
      return;
    }

    try {
      setLoading(true);
      await userAPI.changePassword({
        currentPassword: passwordData.current,
        newPassword: passwordData.new
      });
      showSuccess('Password changed successfully!');
      setPasswordData({ current: '', new: '', confirm: '' });
    } catch (error) {
      console.error('Error changing password:', error);
      showError(error.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleProfilePictureUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setLoading(true);
      const uploadResponse = await uploadAPI.uploadFile(file);
      const filename = uploadResponse.data.filename;
      
      await userAPI.updateProfile({ profilePicture: filename });
      setProfileData({ ...profileData, profilePicture: filename });
      showSuccess('Profile picture uploaded successfully!');
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      showError('Failed to upload profile picture');
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'} p-6 flex items-center justify-center`}>
        <div className={`text-xl ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Loading settings...</div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'} mt-7 p-6`}>
      <div className="max-w-6xl mx-auto">
        <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-8`}>Settings & Customization</h1>

        {/* Tabs */}
        <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white'} rounded-lg shadow-sm mb-6`}>
          <div className={`flex ${isDark ? 'border-gray-700' : 'border-gray-200'} border-b`}>
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                activeTab === 'profile'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : `${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900'}`
              }`}
            >
              <User className="w-5 h-5" />
              Profile Management
            </button>
          </div>
        </div>

        {/* Profile Management Tab */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            {/* Profile Picture */}
            <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm p-6`}>
              <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>Profile Picture</h2>
              <div className="flex items-center gap-6">
                <div className="relative">
                  {profileData.profilePicture ? (
                    <img 
                      src={`http://localhost:3001/uploads/${profileData.profilePicture}`}
                      alt="Profile"
                      className="w-24 h-24 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                      {profileData.name.split(' ').map(n => n[0]).join('') || 'U'}
                    </div>
                  )}
                  <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition-colors">
                    <Camera className="w-4 h-4" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePictureUpload}
                      className="hidden"
                      disabled={loading}
                    />
                  </label>
                </div>
                <div>
                  <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{profileData.name || 'User'}</h3>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{profileData.email}</p>
                  <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'} mt-1`}>Click the camera icon to upload a new picture</p>
                </div>
              </div>
            </div>

            {/* Personal Information */}
            <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm p-6`}>
              <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>Personal Information</h2>
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Full Name</label>
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                    className={`w-full px-4 py-2 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Email Address</label>
                  <input
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                    className={`w-full px-4 py-2 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Phone Number</label>
                  <input
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                    className={`w-full px-4 py-2 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Address</label>
                  <textarea
                    value={profileData.address}
                    onChange={(e) => setProfileData({...profileData, address: e.target.value})}
                    rows="3"
                    className={`w-full px-4 py-2 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  />
                </div>
                <button
                  onClick={handleProfileUpdate}
                  disabled={loading}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Updating...' : 'Update Profile'}
                </button>
              </div>
            </div>

            {/* Change Password */}
            <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm p-6`}>
              <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-4 flex items-center gap-2`}>
                <Lock className="w-5 h-5" />
                Change Password
              </h2>
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Current Password</label>
                  <input
                    type="password"
                    value={passwordData.current}
                    onChange={(e) => setPasswordData({...passwordData, current: e.target.value})}
                    className={`w-full px-4 py-2 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>New Password</label>
                  <input
                    type="password"
                    value={passwordData.new}
                    onChange={(e) => setPasswordData({...passwordData, new: e.target.value})}
                    className={`w-full px-4 py-2 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Confirm New Password</label>
                  <input
                    type="password"
                    value={passwordData.confirm}
                    onChange={(e) => setPasswordData({...passwordData, confirm: e.target.value})}
                    className={`w-full px-4 py-2 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  />
                </div>
                <button
                  onClick={handlePasswordChange}
                  disabled={loading}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}