import React, { useState } from 'react';

const ChatRoomForm = ({ onSubmit }) => {
  const [chatRoomName, setChatRoomName] = useState('');
  const [chatRoomSubtitle, setChatRoomSubtitle] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(chatRoomName, chatRoomSubtitle);
  };

  return (
    <form onSubmit={handleSubmit} className="p-4">
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="chatRoomName">
          Chat Room Name
        </label>
        <input
          type="text"
          id="chatRoomName"
          value={chatRoomName}
          onChange={(e) => setChatRoomName(e.target.value)}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          required
        />
      </div>
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="chatRoomSubtitle">
          Chat Room Subtitle
        </label>
        <input
          type="text"
          id="chatRoomSubtitle"
          value={chatRoomSubtitle}
          onChange={(e) => setChatRoomSubtitle(e.target.value)}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        />
      </div>
      <button
        type="submit"
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
      >
        Start Chat
      </button>
    </form>
  );
};

export default ChatRoomForm;