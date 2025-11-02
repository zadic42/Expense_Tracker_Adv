import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { userAPI } from '../services/api';

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
  const [user, setUser] = useState({
    name: '',
    email: '',
    profilePicture: ''
  })

  const fetchProfile = async () => {
    try {
      const response = await userAPI.getProfile();
      const userData = response.data;
      console.log('User profile data:', userData); // Debug log
      setUser({
        name: userData.name || localStorage.getItem('userName') || '',
        email: userData.email || localStorage.getItem('userEmail') || '',
        profilePicture: userData.profilePicture || ''
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      // Fallback to localStorage if API fails
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
    // Clear all user data from localStorage
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
    <div className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-50">
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
            <span className="text-xl font-semibold text-gray-900">Expense Tracker</span>
          </div>
        </div>

        {/* Right side - User profile and dropdown */}
        <div className="flex items-center space-x-4">
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center space-x-2 focus:outline-none"
            >
              <div className="h-10 w-10 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-medium overflow-hidden">
                {user.profilePicture ? (
                  <img 
                    src={`http://localhost:3001/uploads/${user.profilePicture}`}
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
              <span className="text-sm font-medium text-gray-700">{user.name}</span>
            </button>

            {/* Dropdown menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                <div className="py-1" role="menu">
                  <div className="px-4 py-2 text-sm text-gray-500 border-b border-gray-100">
                    {user.email}
                  </div>
                  <Link
                    to="/settings"
                    onClick={() => setIsDropdownOpen(false)}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    role="menuitem"
                  >
                    Settings
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout()
                      setIsDropdownOpen(false)
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
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