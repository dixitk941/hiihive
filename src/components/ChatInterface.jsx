import React, { useState, useEffect } from 'react';
import { FaPaperPlane, FaChevronLeft, FaChevronRight } from 'react-icons/fa'; // Send icon, Collapse/Expand icons

const ChatInterface = ({ selectedChat }) => {
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false); // State to manage collapse/expand

  useEffect(() => {
    // Load chat messages based on the selected chat
    if (selectedChat === 'chat1') {
      setMessages([
        { sender: 'other', text: 'Hello! How can I help you today?' },
        { sender: 'user', text: 'Hi, I have a question about your services.' },
      ]);
    } else if (selectedChat === 'chat2') {
      setMessages([
        { sender: 'other', text: 'Good afternoon! What do you need help with?' },
        { sender: 'user', text: 'I wanted to know more about your plans.' },
      ]);
    } else if (selectedChat === 'chat3') {
      setMessages([
        { sender: 'other', text: 'Hi! Feel free to ask me anything.' },
        { sender: 'user', text: 'What are your available products?' },
      ]);
    }
  }, [selectedChat]);

  const handleSendMessage = () => {
    if (messageInput.trim()) {
      setMessages([...messages, { sender: 'user', text: messageInput }]);
      setMessageInput('');
    }
  };

  return (
    <aside
      className={`${
        isCollapsed ? 'w-20' : 'w-64'
      } fixed right-0 top-24 h-[calc(100vh-6rem)] bg-white text-gray-800 flex flex-col justify-between p-4 shadow-md border-l border-gray-200 transition-all duration-300`}
    >
      {/* Collapse button */}
      <div className="flex justify-end p-2">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 rounded-full hover:bg-gray-200 transition duration-200"
        >
          {isCollapsed ? (
            <FaChevronRight className="w-6 h-6" />
          ) : (
            <FaChevronLeft className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* Chat messages container */}
      {!isCollapsed && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-100">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs p-3 rounded-lg ${
                  message.sender === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'
                }`}
              >
                <p>{message.text}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Message input section */}
      {!isCollapsed && (
        <div className="flex items-center p-4 bg-white border-t border-gray-300">
          <input
            type="text"
            className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Type a message"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
          />
          <button
            onClick={handleSendMessage}
            className="ml-3 p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors duration-200"
          >
            <FaPaperPlane className="w-5 h-5" />
          </button>
        </div>
      )}
    </aside>
  );
};

export default ChatInterface;
