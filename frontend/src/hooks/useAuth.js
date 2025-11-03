import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Load user from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    const userEmail = localStorage.getItem('userEmail');
    const userName = localStorage.getItem('userName');

    if (token && userId) {
      setUser({
        id: userId,
        email: userEmail,
        name: userName,
      });
    }
    setLoading(false);
  }, []);

  // Normal login
  const login = async (email, password) => {
    try {
      const response = await authAPI.login({ email, password });
      const { token, user } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('userId', user.id);
      localStorage.setItem('userEmail', user.email);
      localStorage.setItem('userName', user.name);

      setUser(user);

      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed',
      };
    }
  };

  // Normal signup
  const signup = async (name, email, password) => {
    try {
      const response = await authAPI.signup({ name, email, password });
      const { token, user } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('userId', user.id);
      localStorage.setItem('userEmail', user.email);
      localStorage.setItem('userName', user.name);

      setUser(user);

      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Signup failed',
      };
    }
  };

  // Logout
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    setUser(null);
    navigate('/login');
  };

  // Handle Google OAuth callback (stores user data from URL params)
  const handleOAuthCallback = useCallback(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');
      const id = urlParams.get('id');
      const email = urlParams.get('email');
      const name = urlParams.get('name');

      console.log('OAuth Callback - Received params:', { token, id, email, name });

      // Check if all required params are present
      if (!token || !id || !email || !name) {
        console.error('Missing OAuth parameters:', { token: !!token, id: !!id, email: !!email, name: !!name });
        return false;
      }

      // Store in localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('userId', id);
      localStorage.setItem('userEmail', email);
      localStorage.setItem('userName', name);

      // Update state
      setUser({ id, email, name });

      console.log('OAuth Callback - Successfully stored user data');
      return true;
    } catch (error) {
      console.error('OAuth callback error:', error);
      return false;
    }
  }, []);

  return {
    user,
    loading,
    login,
    signup,
    logout,
    handleOAuthCallback,
    isAuthenticated: !!user,
  };
};