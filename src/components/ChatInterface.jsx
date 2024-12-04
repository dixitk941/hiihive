import React, { useState, useEffect } from 'react';
import { getFirestore, collection, addDoc, query, onSnapshot, orderBy } from 'firebase/firestore';
import { FaPaperPlane } from 'react-icons/fa';
import { FiArrowLeft } from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';

const ChatInterface = ({ currentUser }) => {
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const navigate = useNavigate();
  const { chatRoomId } = useParams(); // Get chatRoomId from URL parameters
  const db = getFirestore();

  useEffect(() => {
    if (!chatRoomId) {
      console.error('Invalid chatRoomId:', chatRoomId);
      return;
    }

    const messagesRef = collection(db, 'chatRooms', chatRoomId, 'messages');
    const q = query(messagesRef, orderBy('createdAt'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messagesList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(messagesList);
    });

    return () => unsubscribe();
  }, [chatRoomId, db]);

  const handleSendMessage = async () => {
    if (messageInput.trim() === '') return;

    if (!chatRoomId || !currentUser) {
      console.error('chatRoomId or currentUser is undefined');
      return;
    }

    const messagesRef = collection(db, 'chatRooms', chatRoomId, 'messages');
    await addDoc(messagesRef, {
      text: messageInput,
      senderId: currentUser.uid,
      createdAt: new Date().toISOString(),
    });

    setMessageInput('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center p-4 bg-gray-100 border-b">
        <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-blue-600 transition-colors duration-300">
          <FiArrowLeft size={24} />
        </button>
        <h2 className="ml-4 text-xl font-bold">Chat</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((message) => (
          <div key={message.id} className={`mb-4 p-3 rounded-lg ${message.senderId === currentUser.uid ? 'bg-blue-100 self-end' : 'bg-gray-100 self-start'}`}>
            <p className="text-sm">{message.text}</p>
            <span className="text-xs text-gray-500">
              {message.createdAt?.toDate
                ? new Date(message.createdAt.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : 'Invalid Time'}
            </span>
          </div>
        ))}
      </div>
      <div className="p-4 bg-gray-100 border-t">
        <div className="flex items-center">
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
