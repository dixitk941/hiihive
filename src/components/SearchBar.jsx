import React, { useState } from 'react';
import StoryIcon from './StoryIcon';

const SearchBar = () => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="flex items-center justify-center mb-4 relative">
      <input
        type="text"
        placeholder="Search..."
        className={`transition-all duration-300 ease-in-out bg-white text-gray-800 placeholder-gray-500 p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm border-2 border-gray-300 ${expanded ? 'w-64' : 'w-48'}`}
        onFocus={() => setExpanded(true)}
        onBlur={() => setExpanded(false)}
      />
      
      {/* StoryIcon remains fixed to the right side of the input */}
      <StoryIcon className="absolute right-4 top-1/2 transform -translate-y-1/2 cursor-pointer text-gray-500 hover:text-blue-500 transition-colors duration-300" />
    </div>
  );
};

export default SearchBar;
