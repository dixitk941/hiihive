import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const PopUp = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  const handleCreatePost = () => {
    navigate('/upload');
    onClose();
  };

  return (
    isOpen && (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 relative">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 focus:outline-none"
          >
            &times;
          </button>

          {/* Header */}
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800">
              🌟 Let’s Collaborate! 🌟
            </h2>
          </div>

          {/* Content */}
          <div className="mt-4 text-center">
            <p className="text-gray-600">
              Share your thoughts, ideas, or projects with the world! <br />
              Explore the power of <strong>Collaboration Posts</strong> to connect with others and grow together.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex justify-center space-x-4">
            <button
              onClick={handleCreatePost}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600 transition"
            >
              Create Post
            </button>

          </div>
        </div>
      </div>
    )
  );
};

const Header = () => {
  const [popupOpen, setPopupOpen] = useState(true); // Change to false to disable popup initially

  return (
    <div>
      {/* Collaboration Popup */}
      <PopUp isOpen={popupOpen} onClose={() => setPopupOpen(false)} />
    </div>
  );
};

export default Header;
