import React, { useState, useEffect } from 'react';
import StoryIcon from './StoryIcon';

const SearchBar = () => {
  const [expanded, setExpanded] = useState(false);
  const [showStories, setShowStories] = useState(false);

  useEffect(() => {
    let timer;
    if (showStories) {
      // Automatically revert to search view after 5 seconds
      timer = setTimeout(() => setShowStories(false), 5000);
    }
    return () => clearTimeout(timer); // Clean up timer on unmount or state change
  }, [showStories]);

  return (
    <div className="flex items-center justify-center mb-4 relative">
      {!showStories ? (
        <input
          type="text"
          placeholder="Search..."
          className={`transition-all duration-300 ease-in-out bg-white text-gray-800 placeholder-gray-500 p-3 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-lg border-2 border-gray-300 ${expanded ? 'w-64' : 'w-48'}`}
          onFocus={() => setExpanded(true)}
          onBlur={() => setExpanded(false)}
        />
      ) : (
        <div className="flex space-x-3">
          <div className="w-16 h-16 rounded-full overflow-hidden shadow-md border-2 border-blue-400">
            <img src="https://via.placeholder.com/40" alt="Story 1" className="w-full h-full object-cover" />
          </div>
          <div className="w-16 h-16 rounded-full overflow-hidden shadow-md border-2 border-blue-400">
            <img src="https://via.placeholder.com/40" alt="Story 2" className="w-full h-full object-cover" />
          </div>
          <div className="w-16 h-16 rounded-full overflow-hidden shadow-md border-2 border-blue-400">
            <img src="https://via.placeholder.com/40" alt="Story 3" className="w-full h-full object-cover" />
          </div>
        </div>
      )}

      <StoryIcon
        onClick={() => setShowStories(true)}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 cursor-pointer text-gray-500 hover:text-blue-500 transition-colors duration-300"
      />
    </div>
  );
};

export default SearchBar;
