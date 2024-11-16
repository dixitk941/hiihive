import React from 'react';

const ResourceCard = ({ resource }) => {
  return (
    <div className="bg-gradient-to-r from-gray-700 via-gray-900 to-black rounded-lg shadow-xl p-6 transform transition duration-500 hover:scale-105 aspect-square flex flex-col justify-between">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">{resource.title}</h2>
        <p className="text-gray-300 text-sm mb-4">{resource.description}</p>
      </div>
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-400">{resource.author || 'Unknown'}</p>
        <button className="px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition duration-300">
          Save
        </button>
      </div>
    </div>
  );
};

export default ResourceCard;