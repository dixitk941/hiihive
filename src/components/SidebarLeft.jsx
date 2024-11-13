import React, { useState } from 'react';
import { FiSettings, FiLogOut, FiChevronLeft, FiChevronRight, FiHome, FiMessageSquare, FiUpload, FiUsers, FiCompass, FiBell } from 'react-icons/fi';
import { Link } from 'react-router-dom';

const SidebarLeft = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <>
      {/* Sidebar for larger screens */}
      <aside className={`hidden sm:flex fixed left-0 top-24 h-[calc(100vh-6rem)] bg-white text-gray-800 flex-col justify-between p-4 shadow-md border-r border-gray-200 transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
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
          <Link to="/notifications">
            <button className={`flex items-center p-3 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition duration-300 ${isCollapsed ? 'justify-center' : ''}`}>
              <FiBell size={20} />
              <span className={`${isCollapsed ? 'hidden' : 'ml-2 font-semibold'}`}>Notifications</span>
            </button>
          </Link>
          <Link to="/upload">
            <button className={`flex items-center p-3 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition duration-300 ${isCollapsed ? 'justify-center' : ''}`}>
              <FiUpload size={20} />
              <span className={`${isCollapsed ? 'hidden' : 'ml-2 font-semibold'}`}>Upload</span>
            </button>
          </Link>
        </nav>

        {/* Settings and Logout links */}
        <div className="space-y-3">
          <Link to="/settings">
            <button className={`flex items-center p-3 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition duration-300 ${isCollapsed ? 'justify-center' : ''}`}>
              <FiSettings size={20} />
              <span className={`${isCollapsed ? 'hidden' : 'ml-2 font-semibold'}`}>Settings</span>
            </button>
          </Link>
          <Link to="/logout">
            <button className={`flex items-center p-3 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition duration-300 ${isCollapsed ? 'justify-center' : ''}`}>
              <FiLogOut size={20} />
              <span className={`${isCollapsed ? 'hidden' : 'ml-2 font-semibold'}`}>Logout</span>
            </button>
          </Link>
        </div>
      </aside>
    </>
  );
};

export default SidebarLeft;
