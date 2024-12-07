import React, { useState } from 'react';
import { IoArrowBackOutline, IoHappy } from 'react-icons/io5';
import Picker from 'emoji-picker-react';
import { useNavigate } from 'react-router-dom';

const ChatHeader = ({ chatRoomName, onEmojiSelect, currentEmoji }) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const navigate = useNavigate();

  const handleEmojiPickerToggle = () => {
    setShowEmojiPicker((prev) => !prev);
  };

  const handleBackClick = () => {
    navigate('/');
  };

  return (
    <div className="flex items-center justify-between p-2 bg-white text-black shadow-lg rounded-t-xl relative">
      <button
        onClick={handleBackClick}
        className="text-black font-bold p-2 hover:bg-gray-200 rounded-full transition-transform duration-300 transform hover:scale-110"
      >
        <IoArrowBackOutline size={24} />
      </button>
      
      <div className="flex items-center space-x-4">
        <h1 className="text-lg font-semibold">{chatRoomName || 'Chat Room'}</h1>
        <button
          onClick={handleEmojiPickerToggle}
          className="p-2 bg-black text-white rounded-full shadow-md hover:bg-gray-800 transition duration-300 transform hover:scale-110"
        >
          {currentEmoji ? (
            <span className="text-2xl">{currentEmoji}</span>
          ) : (
            <IoHappy size={24} />
          )}
        </button>
        {showEmojiPicker && (
          <div className="absolute top-12 left-1/2 transform -translate-x-1/2 z-50">
            <Picker onEmojiSelect={onEmojiSelect} theme="light" />
          </div>
        )}
      </div>
      
      <div className="w-8"></div> {/* Placeholder for spacing */}
    </div>
  );
};

export default ChatHeader;