import React, { useState } from 'react';

const StoryIcon = () => {
  const [showStories, setShowStories] = useState(false);
  let hoverTimer;

  const handleMouseEnter = () => {
    clearTimeout(hoverTimer);  // Clear any existing timer to avoid hiding too soon
    setShowStories(true);      // Show stories on hover
  };

  const handleMouseLeave = () => {
    // Set a delay before hiding the stories
    hoverTimer = setTimeout(() => setShowStories(false), 300);  // 300ms delay
  };

  return (
    <div
      className="relative ml-4 cursor-pointer"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Main Story Icon with new gradient border */}
      <div className="relative w-14 h-14 bg-gray-300 rounded-full p-[2px]">
        <div className="w-full h-full bg-gradient-to-tr from-blue-400 via-teal-500 to-green-500 rounded-full p-[2px]">
          <div className="w-full h-full bg-white rounded-full">
            <img
              src="https://via.placeholder.com/40"
              alt="User Story"
              className="w-full h-full object-cover rounded-full"
            />
          </div>
        </div>
      </div>

      {/* Additional Stories Displayed on Hover with Delay */}
      {showStories && (
        <div className="absolute top-16 left-0 flex flex-row space-x-2 bg-gray-800 p-2 rounded-lg shadow-lg mt-2 transition-opacity duration-300">
          <div className="w-12 h-12 bg-gray-300 rounded-full overflow-hidden">
            <img src="https://via.placeholder.com/40" alt="Story 1" className="w-full h-full object-cover" />
          </div>
          <div className="w-12 h-12 bg-gray-300 rounded-full overflow-hidden">
            <img src="https://via.placeholder.com/40" alt="Story 2" className="w-full h-full object-cover" />
          </div>
          <div className="w-12 h-12 bg-gray-300 rounded-full overflow-hidden">
            <img src="https://via.placeholder.com/40" alt="Story 3" className="w-full h-full object-cover" />
          </div>
        </div>
      )}
    </div>
  );
};

export default StoryIcon;
