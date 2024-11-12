import React, { useState } from 'react';
import { FiSettings, FiLogOut, FiChevronLeft, FiChevronRight, FiHome, FiMessageSquare, FiUpload, FiUsers } from 'react-icons/fi';

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
          <a href="#" className={`flex items-center p-3 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition duration-300 ${isCollapsed ? 'justify-center' : ''}`}>
            <span className={`${isCollapsed ? 'hidden' : 'ml-2 font-semibold'}`}>Home</span>
          </a>
          <a href="#" className={`flex items-center p-3 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition duration-300 ${isCollapsed ? 'justify-center' : ''}`}>
            <span className={`${isCollapsed ? 'hidden' : 'ml-2 font-semibold'}`}>Explore</span>
          </a>
          <a href="#" className={`flex items-center p-3 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition duration-300 ${isCollapsed ? 'justify-center' : ''}`}>
            <span className={`${isCollapsed ? 'hidden' : 'ml-2 font-semibold'}`}>Notifications</span>
          </a>
        </nav>

        {/* Settings and Logout links */}
        <div className="space-y-3">
          <a href="#" className={`flex items-center p-3 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition duration-300 ${isCollapsed ? 'justify-center' : ''}`}>
            <FiSettings size={20} />
            <span className={`${isCollapsed ? 'hidden' : 'ml-2 font-semibold'}`}>Settings</span>
          </a>
          <a href="#" className={`flex items-center p-3 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition duration-300 ${isCollapsed ? 'justify-center' : ''}`}>
            <FiLogOut size={20} />
            <span className={`${isCollapsed ? 'hidden' : 'ml-2 font-semibold'}`}>Logout</span>
          </a>
        </div>
      </aside>

      {/* Bottom bar for mobile screens */}
      <aside className="sm:hidden fixed bottom-0 left-0 right-0 bg-white text-gray-800 flex justify-between items-center p-4 shadow-md border-t border-gray-200">
        <a href="#" className="flex items-center p-3 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition duration-300">
          <FiHome size={24} />
        </a>
        <a href="#" className="flex items-center p-3 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition duration-300">
          <FiMessageSquare size={24} />
        </a>
        <a href="#" className="flex items-center p-3 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition duration-300">
          <FiUpload size={24} />
        </a>
        <a href="#" className="flex items-center p-3 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition duration-300">
          <FiUsers size={24} />
        </a>
      </aside>
    </>
  );
};

export default SidebarLeft;
