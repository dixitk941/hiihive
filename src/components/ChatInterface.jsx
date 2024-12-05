import React, { useState, useEffect, useRef } from 'react';
import {
  getFirestore,
  collection,
  addDoc,
  query,
  onSnapshot,
  orderBy,
  serverTimestamp,
  doc,
  setDoc,
  getDoc,
} from 'firebase/firestore';
import { FaPaperPlane } from 'react-icons/fa';
import { FiArrowLeft } from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';

const ChatInterface = ({ currentUser }) => {
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingStatus, setTypingStatus] = useState(false);
  const navigate = useNavigate();
  const { chatRoomId } = useParams();
  const db = getFirestore();
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!chatRoomId) {
      console.error('Invalid chatRoomId:', chatRoomId);
      return;
    }

    const messagesRef = collection(db, 'chatRooms', chatRoomId, 'messages');
    const q = query(messagesRef, orderBy('createdAt'));

    const unsubscribeMessages = onSnapshot(q, (snapshot) => {
      const messagesList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMessages(messagesList);
      scrollToBottom();
    });

    const typingStatusRef = doc(db, 'chatRooms', chatRoomId, 'typingStatus', 'status');
    const unsubscribeTypingStatus = onSnapshot(typingStatusRef, (doc) => {
      if (doc.exists()) {
        setTypingStatus(doc.data().isTyping);
      }
    });

    return () => {
      unsubscribeMessages();
      unsubscribeTypingStatus();
    };
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
      createdAt: serverTimestamp(),
    });

    setMessageInput('');
    setIsTyping(false);
    await setDoc(doc(db, 'chatRooms', chatRoomId, 'typingStatus', 'status'), {
      isTyping: false,
    });
  };

  const handleKeyPress = async (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    } else {
      setIsTyping(true);
      await setDoc(doc(db, 'chatRooms', chatRoomId, 'typingStatus', 'status'), {
        isTyping: true,
      });
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg">
        <button
          onClick={() => navigate(-1)}
          className="text-white hover:opacity-80 transition-opacity duration-300"
        >
          <FiArrowLeft size={24} />
        </button>
        <h2 className="ml-4 text-lg font-semibold">Chat Room</h2>
      </div>

      {/* Messages Section */}
      <div className="flex-1 overflow-y-auto px-4 py-2 bg-gray-50">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.senderId === currentUser.uid ? 'justify-end' : 'justify-start'
            } mb-4 animate-fadeIn`}
          >
            <div
              className={`p-3 rounded-lg max-w-lg text-sm shadow-md ${
                message.senderId === currentUser.uid
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-black'
              }`}
            >
              <p>{message.text}</p>
              <span className="block text-xs mt-1 opacity-80">
                {message.createdAt?.toDate
                  ? new Date(message.createdAt.toDate()).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'Sending...'}
              </span>
            </div>
          </div>
        ))}
        {typingStatus && (
          <div className="flex justify-start mb-4">
            <div className="p-3 rounded-lg max-w-lg text-sm shadow-md bg-gray-200 text-black">
              <p>Typing...</p>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="px-4 py-3 bg-gray-100 border-t">
        <div className="flex items-center">
          <input
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 p-3 bg-white border rounded-full shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSendMessage}
            className="ml-2 p-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full shadow-md hover:scale-105 transition-transform duration-200"
          >
            <FaPaperPlane size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
