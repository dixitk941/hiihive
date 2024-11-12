import React from 'react';
import { FiThumbsUp, FiMessageSquare, FiShare2, FiUserPlus } from 'react-icons/fi';

const Feeds = () => (
  <div className="max-h-[80vh] overflow-y-auto space-y-4 px-4 sm:px-6 lg:px-8">
    {/* Feed Post 1 */}
    <div className="bg-white rounded-lg shadow-lg mb-4 w-full sm:max-w-[500px] mx-auto">
      {/* Header with Profile Picture and Username */}
      <div className="flex items-center p-4">
        <img src="profile.jpg" alt="User" className="w-10 h-10 rounded-full border-2 border-gray-300" />
        <div className="ml-3">
          <p className="font-semibold text-gray-800">John Doe</p>
          <p className="text-sm text-gray-500">2 hours ago</p>
        </div>
      </div>

      {/* Post Image */}
      <div className="relative w-full">
        <img src="https://via.placeholder.com/640x640" alt="Post" className="object-cover w-full h-full" />
      </div>

      {/* Post Actions */}
      <div className="flex justify-between items-center p-4 border-t border-gray-200">
        <div className="flex space-x-4">
          <button className="flex items-center text-gray-600 hover:text-blue-600">
            <FiThumbsUp size={20} />
            <span className="ml-2 hidden sm:inline">Like</span>
          </button>
          <button className="flex items-center text-gray-600 hover:text-blue-600">
            <FiMessageSquare size={20} />
            <span className="ml-2 hidden sm:inline">Comment</span>
          </button>
          <button className="flex items-center text-gray-600 hover:text-blue-600">
            <FiShare2 size={20} />
            <span className="ml-2 hidden sm:inline">Share</span>
          </button>
        </div>
        <button className="flex items-center text-gray-600 hover:text-blue-600">
          <FiUserPlus size={20} />
          <span className="ml-2 hidden sm:inline">Follow</span>
        </button>
      </div>

      {/* Post Description */}
      <div className="p-4 text-gray-700">
        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur vel justo eu metus lacinia pretium.</p>
      </div>
    </div>

    {/* Feed Post 2 */}
    <div className="bg-white rounded-lg shadow-lg mb-4 w-full sm:max-w-[500px] mx-auto">
      {/* Header with Profile Picture and Username */}
      <div className="flex items-center p-4">
        <img src="profile.jpg" alt="User" className="w-10 h-10 rounded-full border-2 border-gray-300" />
        <div className="ml-3">
          <p className="font-semibold text-gray-800">Jane Smith</p>
          <p className="text-sm text-gray-500">3 hours ago</p>
        </div>
      </div>

      {/* Post Image */}
      <div className="relative w-full">
        <img src="https://via.placeholder.com/640x640" alt="Post" className="object-cover w-full h-full" />
      </div>

      {/* Post Actions */}
      <div className="flex justify-between items-center p-4 border-t border-gray-200">
        <div className="flex space-x-4">
          <button className="flex items-center text-gray-600 hover:text-blue-600">
            <FiThumbsUp size={20} />
            <span className="ml-2 hidden sm:inline">Like</span>
          </button>
          <button className="flex items-center text-gray-600 hover:text-blue-600">
            <FiMessageSquare size={20} />
            <span className="ml-2 hidden sm:inline">Comment</span>
          </button>
          <button className="flex items-center text-gray-600 hover:text-blue-600">
            <FiShare2 size={20} />
            <span className="ml-2 hidden sm:inline">Share</span>
          </button>
        </div>
        <button className="flex items-center text-gray-600 hover:text-blue-600">
          <FiUserPlus size={20} />
          <span className="ml-2 hidden sm:inline">Follow</span>
        </button>
      </div>

      {/* Post Description */}
      <div className="p-4 text-gray-700">
        <p>Nullam non urna nec metus feugiat ultrices. Etiam tincidunt elit et velit dictum, sit amet rhoncus enim malesuada.</p>
      </div>
    </div>

    {/* Feed Post 3 */}
    <div className="bg-white rounded-lg shadow-lg mb-4 w-full sm:max-w-[500px] mx-auto">
      {/* Header with Profile Picture and Username */}
      <div className="flex items-center p-4">
        <img src="profile.jpg" alt="User" className="w-10 h-10 rounded-full border-2 border-gray-300" />
        <div className="ml-3">
          <p className="font-semibold text-gray-800">Mark Wilson</p>
          <p className="text-sm text-gray-500">4 hours ago</p>
        </div>
      </div>

      {/* Post Image */}
      <div className="relative w-full">
        <img src="https://via.placeholder.com/640x640" alt="Post" className="object-cover w-full h-full" />
      </div>

      {/* Post Actions */}
      <div className="flex justify-between items-center p-4 border-t border-gray-200">
        <div className="flex space-x-4">
          <button className="flex items-center text-gray-600 hover:text-blue-600">
            <FiThumbsUp size={20} />
            <span className="ml-2 hidden sm:inline">Like</span>
          </button>
          <button className="flex items-center text-gray-600 hover:text-blue-600">
            <FiMessageSquare size={20} />
            <span className="ml-2 hidden sm:inline">Comment</span>
          </button>
          <button className="flex items-center text-gray-600 hover:text-blue-600">
            <FiShare2 size={20} />
            <span className="ml-2 hidden sm:inline">Share</span>
          </button>
        </div>
        <button className="flex items-center text-gray-600 hover:text-blue-600">
          <FiUserPlus size={20} />
          <span className="ml-2 hidden sm:inline">Follow</span>
        </button>
      </div>

      {/* Post Description */}
      <div className="p-4 text-gray-700">
        <p>Fusce auctor massa at nulla sodales, vel mollis urna eleifend. Praesent non sem at odio interdum porttitor.</p>
      </div>
    </div>
  </div>
);

export default Feeds;
