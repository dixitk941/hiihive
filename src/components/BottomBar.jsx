import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiHome, FiMessageSquare, FiUpload, FiCompass, FiVideo } from 'react-icons/fi';

const BottomBar = ({ toggleSidebarRight, isStoryActive }) => {
  const navigate = useNavigate();

  return (
    <aside
      className={`sm:hidden fixed bottom-0 left-0 right-0 bg-white text-gray-800 flex justify-between items-center p-2 shadow-lg border-t border-gray-200 z-50 opacity-90 ${
        isStoryActive ? 'hidden' : ''
      }`}
    >
      <button
        onClick={() => navigate('/')}
        className="flex flex-col items-center p-2 rounded-lg hover:bg-gray-100 hover:text-blue-600 transition-all duration-300"
      >
        <FiHome size={20} />
      </button>
      <button
        onClick={toggleSidebarRight}
        className="flex flex-col items-center p-2 rounded-lg hover:bg-gray-100 hover:text-blue-600 transition-all duration-300"
      >
        <FiMessageSquare size={20} />
      </button>
      <button
        onClick={() => navigate('/upload')}
        className="flex flex-col items-center p-2 rounded-lg hover:bg-gray-100 hover:text-blue-600 transition-all duration-300"
      >
        <FiUpload size={20} />
      </button>
      <button
        onClick={() => navigate('/hivee')}
        className="flex flex-col items-center p-2 rounded-lg hover:bg-gray-100 hover:text-blue-600 transition-all duration-300"
      >
        <FiVideo size={20} />
        </button>
      <button
        onClick={() => navigate('/explore')}
        className="flex flex-col items-center p-2 rounded-lg hover:bg-gray-100 hover:text-blue-600 transition-all duration-300"
      >
        <FiCompass size={20} />
        </button>
    </aside>
  );
};

export default BottomBar;
