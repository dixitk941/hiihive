import React from 'react';

const StoryIcon = ({ onClick }) => (
  <div
    className="relative ml-4 cursor-pointer"
    onClick={onClick} // Activate story mode on click
  >
    <div className="relative w-14 h-14 bg-gray-300 rounded-full p-[2px] shadow-lg hover:shadow-xl transition-shadow duration-200">
      <div className="w-full h-full bg-gradient-to-tr from-blue-500 via-teal-400 to-green-400 rounded-full p-[2px]">
        <div className="w-full h-full bg-white rounded-full">
          <img
            src="https://via.placeholder.com/40"
            alt="User Story"
            className="w-full h-full object-cover rounded-full"
          />
        </div>
      </div>
    </div>
  </div>
);

export default StoryIcon;
