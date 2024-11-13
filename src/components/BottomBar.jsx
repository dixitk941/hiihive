import React from 'react';
import { FiHome, FiMessageSquare, FiUpload, FiUsers } from 'react-icons/fi';

const BottomBar = () => {
  return (
    <aside className="sm:hidden fixed bottom-0 left-0 right-0 bg-white text-gray-800 flex justify-between items-center p-4 shadow-md border-t border-gray-200">
      <a href="#" className="flex items-center p-3 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition duration-300">
        <FiHome size={24} />
      </a>
      <a href="/chatlist" className="flex items-center p-3 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition duration-300">
        <FiMessageSquare size={24} />
      </a>
      <a href="#" className="flex items-center p-3 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition duration-300">
        <FiUpload size={24} />
      </a>
      <a href="#" className="flex items-center p-3 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition duration-300">
        <FiUsers size={24} />
      </a>
    </aside>
  );
};

export default BottomBar;
