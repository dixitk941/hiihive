import React from 'react';
import { useNavigate } from 'react-router-dom';
import { HomeIcon, ChatBubbleLeftIcon, ArrowUpTrayIcon, MagnifyingGlassIcon, PlayIcon } from '@heroicons/react/24/outline'; // PlayIcon for Hivees

const BottomBar = ({ toggleSidebarRight, isStoryActive }) => {
  const navigate = useNavigate();

  return (
    <aside
      className={`sm:hidden fixed bottom-0 left-0 right-0 bg-white text-gray-800 flex justify-between items-center p-4 rounded-lg shadow-2xl transform transition-all duration-300 z-50 ${
        isStoryActive ? 'hidden' : ''
      }`}
      style={{
        boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)', // Adds a shadow for 3D effect
        transform: 'translateY(-10px)', // Lifts the bar up for floating effect
        perspective: '500px', // Provides a 3D perspective
      }}
    >
      <button
        onClick={() => navigate('/')}
        className="flex flex-col items-center p-2 rounded-lg hover:bg-gray-100 hover:text-blue-600 transition-all duration-300"
      >
        <HomeIcon className="h-6 w-6" /> {/* Home Icon */}
      </button>
      <button
        onClick={toggleSidebarRight}
        className="flex flex-col items-center p-2 rounded-lg hover:bg-gray-100 hover:text-blue-600 transition-all duration-300"
      >
        <ChatBubbleLeftIcon className="h-6 w-6" /> {/* Message Icon */}
      </button>
      <button
        onClick={() => navigate('/upload')}
        className="flex flex-col items-center p-2 rounded-lg hover:bg-gray-100 hover:text-blue-600 transition-all duration-300"
      >
        <ArrowUpTrayIcon className="h-6 w-6" /> {/* Upload Icon */}
      </button>
      <button
        onClick={() => navigate('/hivee')}
        className="flex flex-col items-center p-2 rounded-lg hover:bg-gray-100 hover:text-blue-600 transition-all duration-300"
      >
        <PlayIcon className="h-6 w-6" /> {/* Hivees Icon - Play Icon for short videos */}
      </button>
      <button
        onClick={() => navigate('/explore')}
        className="flex flex-col items-center p-2 rounded-lg hover:bg-gray-100 hover:text-blue-600 transition-all duration-300"
      >
        <MagnifyingGlassIcon className="h-6 w-6" /> {/* Explore Icon */}
      </button>
    </aside>
  );
};

export default BottomBar;
