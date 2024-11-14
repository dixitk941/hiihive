import React, { useState, useEffect } from 'react';
import { getDatabase, ref, push, onValue } from 'firebase/database';
import { FaPaperPlane } from 'react-icons/fa';
import { FiArrowLeft } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const ChatInterface = ({ chatRoomId, currentUser }) => {
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const db = getDatabase();
    const messagesRef = ref(db, `chatRooms/${chatRoomId}/messages`);

    onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      const messagesList = data ? Object.values(data) : [];
      setMessages(messagesList);
    });
  }, [chatRoomId]);

  const handleSendMessage = async () => {
    if (messageInput.trim() === '') return;

    const db = getDatabase();
    const messagesRef = ref(db, `chatRooms/${chatRoomId}/messages`);

    const newMessage = {
      senderId: currentUser.uid,
      text: messageInput,
      timestamp: new Date().toISOString(),
    };

    await push(messagesRef, newMessage);
    setMessageInput('');
  };

  const handleBack = () => {
    navigate('/'); // Navigate to the home page
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full max-w-md mx-auto bg-white border rounded-lg shadow-xl">
      {/* Header */}
      <div className="flex items-center p-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg sticky top-0 z-10 rounded-t-lg">
        <button onClick={handleBack} className="mr-4 text-white hover:text-gray-300">
          <FiArrowLeft size={24} />
        </button>
        <h2 className="text-xl font-semibold">Chat Room</h2>
      </div>

      {/* Messages Container */}
      <div className="flex-1 flex flex-col p-4 space-y-4 overflow-y-auto mb-20">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.senderId === currentUser.uid ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`p-4 rounded-lg max-w-xs md:max-w-md ${
                message.senderId === currentUser.uid
                  ? 'bg-blue-500 text-white rounded-bl-none'
                  : 'bg-gray-200 text-gray-800 rounded-br-none'
              } shadow-md`}
            >
              <p>{message.text}</p>
              <span className="text-xs text-gray-400 mt-1 block">
                {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Input Field */}
      <div className="p-4 bg-gray-100 rounded-b-lg border-t border-gray-300">
        <div className="flex items-center w-full space-x-3">
          <input
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 p-3 bg-white border rounded-full shadow-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSendMessage}
            className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full shadow-lg transition-all duration-200 hover:scale-105"
          >
            <FaPaperPlane size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
