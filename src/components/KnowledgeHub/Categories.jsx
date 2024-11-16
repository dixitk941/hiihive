import React from 'react';

const Categories = ({ categories, onSelectCategory }) => {
  return (
    <div className="flex justify-center space-x-4 mb-6">
      {categories.map((category, index) => (
        <button
          key={index}
          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-lg transition-all duration-500 ease-in-out transform hover:scale-110"
          onClick={() => onSelectCategory(category)}
        >
          {category}
        </button>
      ))}
    </div>
  );
};

export default Categories;