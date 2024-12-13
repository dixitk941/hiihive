import React from 'react';
import { useNavigate } from 'react-router-dom';
import { HomeIcon, ChatBubbleLeftIcon, ArrowUpTrayIcon, MagnifyingGlassIcon, PlayIcon } from '@heroicons/react/24/outline'; // PlayIcon for Hivees

const BottomBar = ({ toggleSidebarRight, isStoryActive }) => {
  const navigate = useNavigate();

  return (
    <aside
      className={`sm:hidden fixed bottom-0 left-0 right-0 bg-white text-gray-800 flex justify-between items-center p-2 rounded-lg transition-all duration-150 z-50 ${ // Reduced duration for faster transition
        isStoryActive ? 'hidden' : ''
      }`}
      style={{
        // No floating effect or thickness styles
      }}
    >
      <button
        onClick={() => navigate('/')}
        className="flex flex-col items-center p-2 rounded-lg hover:bg-gray-100 hover:text-blue-600 transition-all duration-150" // Reduced duration for faster transition
      >
        <HomeIcon className="h-5 w-5" /> {/* Smaller Home Icon */}
      </button>
      <button
        onClick={toggleSidebarRight}
        className="flex flex-col items-center p-2 rounded-lg hover:bg-gray-100 hover:text-blue-600 transition-all duration-150" // Reduced duration for faster transition
      >
        <ChatBubbleLeftIcon className="h-5 w-5" /> {/* Smaller Message Icon */}
      </button>
      <button
        onClick={() => navigate('/upload')}
        className="flex flex-col items-center p-2 rounded-lg hover:bg-gray-100 hover:text-blue-600 transition-all duration-150" // Reduced duration for faster transition
      >
        <ArrowUpTrayIcon className="h-5 w-5" /> {/* Smaller Upload Icon */}
      </button>
      <button
        onClick={() => navigate('/hivee')}
        className="flex flex-col items-center p-2 rounded-lg hover:bg-gray-100 hover:text-blue-600 transition-all duration-150" // Reduced duration for faster transition
      >
        <PlayIcon className="h-5 w-5" /> {/* Smaller Hivees Icon */}
      </button>
      <button
        onClick={() => navigate('/explore')}
        className="flex flex-col items-center p-2 rounded-lg hover:bg-gray-100 hover:text-blue-600 transition-all duration-150" // Reduced duration for faster transition
      >
        <MagnifyingGlassIcon className="h-5 w-5" /> {/* Smaller Explore Icon */}
      </button>
    </aside>
  );
};

export default BottomBar;
