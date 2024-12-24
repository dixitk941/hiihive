import React, { useState, useEffect } from 'react';

const PopUp = ({ onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const hasSeenPopup = localStorage.getItem('hasSeenPopup');
    if (!hasSeenPopup) {
      setIsVisible(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem('hasSeenPopup', 'true');
    setIsVisible(false);
    if (onClose) onClose();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 relative">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 focus:outline-none"
        >
          &times;
        </button>

        {/* Header */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800">
            🔔 Update Notice 🔔
          </h2>
        </div>

        {/* Content */}
        <div className="mt-4 text-center">
          <p className="text-gray-600">
            🎉 We have made some exciting updates to our platform! 🎉 <br />
            Check out the latest features and improvements to enhance your experience.
          </p>
        </div>

        {/* Action Button */}
        <div className="mt-6 text-center">
          <a
            href="https://expo.dev/accounts/maruti941/projects/hiihiveapp/builds/a3b96215-9980-4d1c-ba0f-3c804f5b746a"
            className="px-6 py-2 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600 transition font-bold"
            target="_blank"
            rel="noopener noreferrer"
          >
            🚀 Download the Latest Update Now! 🚀
          </a>
        </div>
      </div>
    </div>
  );
};

const Header = () => {
  const [popupOpen, setPopupOpen] = useState(true); // Change to false to disable popup initially

  return (
    <div>
      {/* Collaboration Popup */}
      <PopUp onClose={() => setPopupOpen(false)} />
    </div>
  );
};

export default Header;
