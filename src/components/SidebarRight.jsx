import React, { useState } from 'react';
import { FiMessageSquare, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const SidebarRight = ({ setSelectedChat }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleChatSelection = (chatId) => {
    setSelectedChat(chatId); // Set the selected chat
  };

  return (
    <aside className={`${isCollapsed ? 'w-20' : 'w-64'} fixed right-0 top-24 h-[calc(100vh-6rem)] bg-white text-gray-800 flex flex-col justify-between p-4 shadow-md border-l border-gray-200 transition-all duration-300`}>
      <div>
        {/* Collapse/Expand Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-gray-500 hover:text-blue-600 transition-colors duration-300 mb-4"
        >
          {isCollapsed ? <FiChevronRight size={24} /> : <FiChevronLeft size={24} />}
        </button>
        
        <h2 className={`${isCollapsed ? 'hidden' : 'text-xl font-bold mb-6 text-gray-700'}`}>Chats</h2>

        {/* List of Chats */}
        <div className="space-y-3">
          <div
            onClick={() => handleChatSelection('chat1')}
            className={`flex items-center p-3 bg-gray-100 rounded-lg hover:bg-blue-50 transition duration-300 ${isCollapsed ? 'justify-center' : ''}`}
          >
            <FiMessageSquare className="text-blue-500" size={20} />
            <span className={`${isCollapsed ? 'hidden' : 'ml-3 font-semibold'}`}>Chat 1</span>
          </div>
          <div
            onClick={() => handleChatSelection('chat2')}
            className={`flex items-center p-3 bg-gray-100 rounded-lg hover:bg-blue-50 transition duration-300 ${isCollapsed ? 'justify-center' : ''}`}
          >
            <FiMessageSquare className="text-blue-500" size={20} />
            <span className={`${isCollapsed ? 'hidden' : 'ml-3 font-semibold'}`}>Chat 2</span>
          </div>
          <div
            onClick={() => handleChatSelection('chat3')}
            className={`flex items-center p-3 bg-gray-100 rounded-lg hover:bg-blue-50 transition duration-300 ${isCollapsed ? 'justify-center' : ''}`}
          >
            <FiMessageSquare className="text-blue-500" size={20} />
            <span className={`${isCollapsed ? 'hidden' : 'ml-3 font-semibold'}`}>Chat 3</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default SidebarRight;