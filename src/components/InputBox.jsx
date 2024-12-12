import React, { useState } from 'react';
import { FaSmile, FaPaperclip, FaImage, FaPaperPlane } from 'react-icons/fa';
import Picker from '@emoji-mart/react';
import { marked } from 'marked';
import { useParams } from 'react-router-dom';

const ChatInput = ({ handleSendMessage }) => {
  const [messageInput, setMessageInput] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [file, setFile] = useState(null);
  const [image, setImage] = useState(null);
  const { chatRoomId } = useParams(); // Get chatRoomId from URL params

  const handleEmojiClick = (emoji) => {
    setMessageInput((prev) => prev + emoji.native);
    setShowEmojiPicker(false); // Close emoji picker after selecting an emoji
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-300 p-4 flex items-center space-x-2 z-10">
      <div className="relative flex-1">
        <textarea
          placeholder="Type a message... (Markdown supported)"
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring focus:ring-blue-300 resize-none"
          rows="2"
        ></textarea>
        <button
          className="absolute top-2 right-2 text-lg text-gray-600 hover:text-gray-800"
          onClick={() => setShowEmojiPicker((prev) => !prev)}
        >
          <FaSmile />
        </button>
        {showEmojiPicker && (
          <div className="absolute bottom-12 right-0">
            <Picker onEmojiClick={handleEmojiClick} />
          </div>
        )}
      </div>

      {/* File Upload */}
      <input
        type="file"
        onChange={(e) => setFile(e.target.files[0])}
        className="hidden"
        id="file-upload"
      />
      <label htmlFor="file-upload" className="cursor-pointer text-gray-600 hover:text-gray-800">
        <FaPaperclip size={20} />
      </label>

      {/* Image Upload */}
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setImage(e.target.files[0])}
        className="hidden"
        id="image-upload"
      />
      <label htmlFor="image-upload" className="cursor-pointer text-gray-600 hover:text-gray-800">
        <FaImage size={20} />
      </label>

      {/* Send Button */}
      <button
        onClick={() => handleSendMessage(messageInput, file, image, chatRoomId)}
        className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700"
      >
        <FaPaperPlane />
      </button>
    </div>
  );
};

export default ChatInput;
