import React, { useState, useEffect } from 'react';
import { FiSettings, FiLogOut, FiChevronLeft, FiChevronRight, FiHome, FiMessageSquare, FiUpload, FiUsers, FiCompass, FiBell } from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from './firebaseConfig';  // Your firebase config file to access auth

const SidebarLeft = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showLogoutWarning, setShowLogoutWarning] = useState(false); // State to toggle logout warning modal
  const [darkMode, setDarkMode] = useState(false); // State to manage dark mode
  const navigate = useNavigate();

  // Automatically detect dark mode based on device preference
  useEffect(() => {
    const userPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDarkMode(userPrefersDark); // Set dark mode based on the device preference

    // Save the preference in localStorage if it changes
    const handleChange = (e) => {
      setDarkMode(e.matches);
    };

    // Listen for system theme change
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', handleChange);

    // Clean up event listener on component unmount
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Toggle dark mode manually and save it to localStorage
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    localStorage.setItem('darkMode', !darkMode); // Save dark mode preference to localStorage
  };

  const handleLogout = async () => {
    try {
      await signOut(auth); // Sign out from Firebase
      navigate('/login'); // Navigate to the login page
    } catch (error) {
      // Handle error during logout
    }
  };

  const toggleLogoutWarning = () => {
    setShowLogoutWarning(!showLogoutWarning); // Toggle logout warning modal visibility
  };

  return (
    <>
      {/* Sidebar for larger screens */}
      <aside
        className={`hidden sm:flex fixed left-0 top-24 h-[calc(100vh-6rem)] 
          ${darkMode ? 'bg-black text-white' : 'bg-white text-black'} 
          flex-col justify-between p-4 shadow-md 
          border-r ${darkMode ? 'border-gray-700' : 'border-gray-200'} 
          transition-all duration-300 transition-colors ${isCollapsed ? 'w-20' : 'w-64'}`}
      >
        {/* Button to toggle collapse */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-gray-500 hover:text-blue-600 transition-colors duration-300 mb-4"
        >
          {isCollapsed ? <FiChevronRight size={24} /> : <FiChevronLeft size={24} />}
        </button>

        {/* Navigation for larger screens */}
        <nav className="space-y-3">
          <Link to="/">
            <button className={`flex items-center p-3 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition duration-300 ${isCollapsed ? 'justify-center' : ''}`}>
              <FiHome size={20} />
              <span className={`${isCollapsed ? 'hidden' : 'ml-2 font-semibold'}`}>Home</span>
            </button>
          </Link>
          <Link to="/explore">
            <button className={`flex items-center p-3 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition duration-300 ${isCollapsed ? 'justify-center' : ''}`}>
              <FiCompass size={20} />
              <span className={`${isCollapsed ? 'hidden' : 'ml-2 font-semibold'}`}>Explore</span>
            </button>
          </Link>
          <Link to="/chatlist">
            <button className={`flex items-center p-3 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition duration-300 ${isCollapsed ? 'justify-center' : ''}`}>
              <FiMessageSquare size={20} />
              <span className={`${isCollapsed ? 'hidden' : 'ml-2 font-semibold'}`}>Chat List</span>
            </button>
          </Link>
          <Link to="/upload">
            <button className={`flex items-center p-3 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition duration-300 ${isCollapsed ? 'justify-center' : ''}`}>
              <FiUpload size={20} />
              <span className={`${isCollapsed ? 'hidden' : 'ml-2 font-semibold'}`}>Upload</span>
            </button>
          </Link>
        </nav>

        {/* Dark Mode Toggle Button */}
        {/* <div className="flex justify-center mt-4">
          <button
            onClick={toggleDarkMode}
            className={`p-2 rounded-full ${darkMode ? 'bg-white text-black' : 'bg-black text-white'} transition-all duration-300`}
          >
            {darkMode ? '🌙' : '☀️'}
          </button>
        </div> */}

        {/* Settings and Logout links */}
        <div className="space-y-3">
          <Link to="/settings">
            <button className={`flex items-center p-3 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition duration-300 ${isCollapsed ? 'justify-center' : ''}`}>
              <FiSettings size={20} />
              <span className={`${isCollapsed ? 'hidden' : 'ml-2 font-semibold'}`}>Settings</span>
            </button>
          </Link>
          <button onClick={toggleLogoutWarning} className={`flex items-center p-3 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition duration-300 ${isCollapsed ? 'justify-center' : ''}`}>
            <FiLogOut size={20} />
            <span className={`${isCollapsed ? 'hidden' : 'ml-2 font-semibold'}`}>Logout</span>
          </button>
        </div>
      </aside>

      {/* Logout Warning Modal */}
      {showLogoutWarning && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-4">Are you sure you want to log out?</h3>
            <div className="flex justify-between">
              <button 
                onClick={handleLogout} 
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Yes
              </button>
              <button 
                onClick={toggleLogoutWarning} 
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SidebarLeft;
