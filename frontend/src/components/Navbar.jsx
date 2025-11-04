import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { userAPI } from '../services/api';
import { useTheme } from '../contexts/ThemeContext';

// Helper function to get initials from name
const getInitials = (name) => {
  if (!name) return 'U';
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

const Navbar = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const navigate = useNavigate()
  const dropdownRef = useRef(null)
  const { isDark, toggleTheme } = useTheme(); // Use theme context
  const [user, setUser] = useState({
    name: '',
    email: '',
    profilePicture: ''
  })

  const fetchProfile = async () => {
    try {
      const response = await userAPI.getProfile();
      const userData = response.data;
      console.log('User profile data:', userData);
      setUser({
        name: userData.name || localStorage.getItem('userName') || '',
        email: userData.email || localStorage.getItem('userEmail') || '',
        profilePicture: userData.profilePicture || ''
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      setUser({
        name: localStorage.getItem('userName') || '',
        email: localStorage.getItem('userEmail') || '',
        profilePicture: ''
      });
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('userRole')
    localStorage.removeItem('userId')
    localStorage.removeItem('userEmail')
    localStorage.removeItem('userName')
    localStorage.removeItem('mfaEnabled')
    navigate('/login')
    window.location.reload()
  }

  return (
    <div className={`fixed top-0 left-0 right-0 h-16 ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'} border-b z-50`}>
      <div className="flex items-center justify-between h-full px-4">
        {/* Logo */}
        <div className="flex items-center">
          <div className="flex items-center space-x-2">
            <svg
              className="h-8 w-8 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            <span className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Expense Tracker</span>
          </div>
        </div>

        {/* Right side - Dark mode toggle, User profile and dropdown */}
        <div className="flex items-center space-x-4">
          {/* Dark Mode Toggle Button */}
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-lg ${isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}
            aria-label="Toggle dark mode"
          >
            {isDark ? (
              // Sun icon for light mode
              <svg className="h-5 w-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              // Moon icon for dark mode
              <svg className="h-5 w-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center space-x-2 focus:outline-none"
            >
              <div className="h-10 w-10 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-medium overflow-hidden">
                {user.profilePicture ? (
                  <img 
                    src={`${import.meta.env.VITE_BACKEND_API_URL}/uploads/${user.profilePicture}`}
                    alt={user.name} 
                    className="h-full w-full object-cover"
                    onLoad={(e) => console.log('Image loaded successfully')}
                    onError={(e) => {
                      console.error('Error loading profile picture:', e);
                      e.target.style.display = 'none';
                      if (e.target.nextSibling) {
                        e.target.nextSibling.style.display = 'flex';
                      }
                    }}
                  />
                ) : null}
                <div className={`${user.profilePicture ? 'hidden' : 'flex'} items-center justify-center h-full w-full`}>
                  {getInitials(user.name)}
                </div>
              </div>
              <span className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>{user.name}</span>
            </button>

            {/* Dropdown menu */}
            {isDropdownOpen && (
              <div className={`absolute right-0 mt-2 w-48 rounded-md shadow-lg ${isDark ? 'bg-gray-800' : 'bg-white'} ring-1 ring-black ring-opacity-5`}>
                <div className="py-1" role="menu">
                  <div className={`px-4 py-2 text-sm ${isDark ? 'text-gray-400 border-gray-700' : 'text-gray-500 border-gray-100'} border-b`}>
                    {user.email}
                  </div>
                  <Link
                    to="/settings"
                    onClick={() => setIsDropdownOpen(false)}
                    className={`block w-full text-left px-4 py-2 text-sm ${isDark ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'}`}
                    role="menuitem"
                  >
                    Settings
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout()
                      setIsDropdownOpen(false)
                    }}
                    className={`w-full text-left px-4 py-2 text-sm text-red-600 ${isDark ? 'hover:bg-gray-700' : 'hover:bg-red-50'}`}
                    role="menuitem"
                  >
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Navbar