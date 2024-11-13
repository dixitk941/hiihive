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

    // Listen for new messages
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
    <div className="flex flex-col h-full bg-gray-100">
      <div className="flex items-center p-4 bg-white shadow-md sticky top-0 z-10">
        <button onClick={handleBack} className="mr-4 text-blue-500 hover:text-blue-700">
          <FiArrowLeft size={24} />
        </button>
        <h2 className="text-xl font-semibold">Chat Room</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4 mb-24">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.senderId === currentUser.uid ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`p-3 rounded-lg max-w-xs md:max-w-md lg:max-w-lg ${
                message.senderId === currentUser.uid ? 'bg-blue-500 text-white' : 'bg-white text-gray-800'
              } shadow-md`}
            >
              <p>{message.text}</p>
              <span className="text-xs text-gray-400 mt-1 block">
                {new Date(message.timestamp).toLocaleTimeString()}
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center p-4 bg-white border-t border-gray-200 fixed bottom-0 left-0 right-0 z-10 w-full md:mx-4 lg:mx-32">
        <input
          type="text"
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message"
          className="flex-1 p-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleSendMessage}
          className="ml-2 p-2 text-white bg-blue-500 hover:bg-blue-600 rounded-full transition duration-200"
        >
          <FaPaperPlane />
        </button>
      </div>
    </div>
  );
};

export default ChatInterface;
