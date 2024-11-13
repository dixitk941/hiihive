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
    <div className="flex flex-col h-full max-w-md mx-auto bg-gray-50 border rounded-lg shadow-md">
      {/* Header */}
      <div className="flex items-center p-4 bg-white shadow sticky top-0 z-10">
        <button onClick={handleBack} className="mr-4 text-gray-800 hover:text-gray-900">
          <FiArrowLeft size={24} />
        </button>
        <h2 className="text-lg font-semibold text-gray-900">Chat Room</h2>
      </div>

      {/* Messages Container */}
      <div className="flex-1 flex flex-col p-4 space-y-2 overflow-y-auto" style={{ paddingBottom: '120px' }}>
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.senderId === currentUser.uid ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`p-3 rounded-2xl max-w-xs md:max-w-md ${
                message.senderId === currentUser.uid
                  ? 'bg-blue-500 text-white rounded-br-none'
                  : 'bg-gray-200 text-gray-800 rounded-bl-none'
              } shadow-sm`}
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
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-gray-50 p-3">
        <div className="flex items-center p-2 bg-white rounded-full border border-gray-300 shadow-inner">
          <input
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Message..."
            className="flex-1 p-2 bg-transparent border-none focus:outline-none"
          />
          <button
            onClick={handleSendMessage}
            className="ml-3 p-2 bg-blue-500 text-white rounded-full transition duration-200 hover:bg-blue-600"
          >
            <FaPaperPlane />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
