import React from 'react';

const SearchBar = ({ query, setQuery, onSearch }) => {
  const handleInputChange = (e) => {
    setQuery(e.target.value);
    onSearch(e.target.value); // Call the search function
  };

  return (
    <div className="flex justify-center mb-4">
      <div className="relative w-full sm:w-1/2">
        <input
          type="text"
          className="w-full px-4 py-2 pr-16 border border-transparent rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-lg transition duration-300 ease-in-out transform hover:scale-105"
          placeholder="Search for resources..."
          value={query}
          onChange={handleInputChange}
          style={{
            background: 'linear-gradient(135deg, #1f2937, #3b82f6)',
            color: 'white',
          }}
        />
        <button
          className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-full hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-lg transition duration-300 ease-in-out transform hover:scale-105"
          onClick={() => onSearch(query)}
        >
          Search
        </button>
      </div>
    </div>
  );
};

export default SearchBar;