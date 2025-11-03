import React, { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FcGoogle } from 'react-icons/fc';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';

const GoogleOAuthButton = ({ text = 'Continue with Google', fullWidth = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { handleOAuthCallback } = useAuth();
  const { showError, showSuccess } = useToast();
  const hasProcessedCallback = useRef(false);
  console.log('API URL:', import.meta.env.VITE_BACKEND_API_URL);

  // Check for OAuth callback when component mounts
  useEffect(() => {
    // Only process once to avoid infinite loops
    if (hasProcessedCallback.current) {
      return;
    }

    const checkOAuthCallback = async () => {
      const urlParams = new URLSearchParams(location.search);
      
      // Only process if we have token or error params
      if (!urlParams.has('token') && !urlParams.has('error')) {
        return;
      }

      console.log('Checking OAuth callback, URL params:', Object.fromEntries(urlParams));
      
      // Mark as processed to prevent re-running
      hasProcessedCallback.current = true;
      
      // Handle error
      if (urlParams.has('error')) {
        const error = urlParams.get('error');
        console.error('OAuth error:', error);
        showError(error || 'Authentication failed');
        // Clean up URL
        navigate('/login', { replace: true });
        return;
      }
      
      // Handle success
      if (urlParams.has('token')) {
        console.log('Token found in URL, processing callback...');
        const success = handleOAuthCallback();
        
        if (success) {
          console.log('OAuth callback successful, redirecting to dashboard');
          showSuccess('Successfully logged in with Google!');
          // Clean up URL and redirect to dashboard
          setTimeout(() => {
            navigate('/dashboard', { replace: true });
          }, 500);
        } else {
          console.error('OAuth callback failed');
          showError('Failed to complete authentication. Please try again.');
          navigate('/login', { replace: true });
        }
      }
    };
    
    checkOAuthCallback();
  }, [location.search, handleOAuthCallback, navigate, showError, showSuccess]);

  const handleGoogleLogin = () => {
    try {
      const apiUrl = import.meta.env.VITE_BACKEND_API_URL;
      console.log('Initiating Google login, redirecting to:', `${apiUrl}/api/auth/google`);
      // Just redirect to the backend OAuth endpoint
      // The backend handles the redirect_uri internally
      window.location.href = `${apiUrl}/api/auth/google`;
    } catch (error) {
      showError('Failed to initiate Google login');
      console.error('Google login error:', error);
    }
  };

  return (
    <button
      type="button"
      onClick={handleGoogleLogin}
      className={`flex items-center justify-center w-full gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
        fullWidth ? 'w-full' : ''
      }`}
    >
      <FcGoogle className="w-5 h-5" />
      <span>{text}</span>
    </button>
  );
};

export default GoogleOAuthButton;