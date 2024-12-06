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
  getDoc,
} from 'firebase/firestore';
import { FaPaperPlane, FaPaperclip, FaCamera, FaFileAlt, FaUser } from 'react-icons/fa';
import { useParams } from 'react-router-dom';
import ChatHeader from './ChatHeader';

const ChatInterface = ({ currentUser }) => {
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [showAttachmentOptions, setShowAttachmentOptions] = useState(false);
  const [userAvatars, setUserAvatars] = useState({});
  const { chatRoomId } = useParams();
  const db = getFirestore();
  const messagesContainerRef = useRef(null);

  useEffect(() => {
    if (!chatRoomId) {
      console.error('Invalid chatRoomId:', chatRoomId);
      return;
    }

    const messagesRef = collection(db, 'chatRooms', chatRoomId, 'messages');
    const q = query(messagesRef, orderBy('createdAt'));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const messagesList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const newAvatars = { ...userAvatars };
      await Promise.all(
        messagesList.map(async (msg) => {
          if (!newAvatars[msg.senderId]) {
            const userRef = doc(db, 'users', msg.senderId);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
              newAvatars[msg.senderId] = userSnap.data().avatar || 'default-avatar-url';
            }
          }
        })
      );

      setUserAvatars(newAvatars);
      setMessages(messagesList);

      if (messages.length < messagesList.length) scrollToBottom();
    });

    return () => unsubscribe();
  }, [chatRoomId, db, messages.length, userAvatars]);

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
  };

  const handleAttachmentClick = (type) => {
    setShowAttachmentOptions(false);
    if (type === 'camera') {
      // Open the camera
      alert('Opening Camera...');
    } else if (type === 'photos') {
      // Open photos
      alert('Opening Photos...');
    } else if (type === 'document') {
      // Open file manager for documents
      alert('Opening File Manager...');
    } else if (type === 'contact') {
      // Open contacts
      alert('Opening Contacts...');
    }
  };

  const scrollToBottom = () => {
    messagesContainerRef.current?.scrollTo({
      top: messagesContainerRef.current.scrollHeight,
      behavior: 'smooth',
    });
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Chat Header */}
      <ChatHeader />

      {/* Messages Section */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50"
      >
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.senderId === currentUser.uid ? 'justify-end' : 'justify-start'
            }`}
          >
            <div className="flex items-center space-x-2">
              {message.senderId !== currentUser.uid && (
                <img
                  src={userAvatars[message.senderId] || 'default-avatar-url'}
                  alt="User Avatar"
                  className="w-8 h-8 rounded-full"
                />
              )}
              <div
                className={`p-3 rounded-lg shadow-sm ${
                  message.senderId === currentUser.uid
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800'
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
          </div>
        ))}
      </div>

      {/* Input Bar */}
      <div className="p-3 bg-gray-200 border-t">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowAttachmentOptions(!showAttachmentOptions)}
            className="p-2 bg-gray-300 rounded-full hover:bg-gray-400"
          >
            <FaPaperclip size={18} />
          </button>

          {showAttachmentOptions && (
            <div className="absolute bottom-16 left-4 bg-white p-3 rounded-lg shadow-lg space-y-2">
              <button
                onClick={() => handleAttachmentClick('camera')}
                className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-md"
              >
                <FaCamera />
                <span>Camera</span>
              </button>
              <button
                onClick={() => handleAttachmentClick('photos')}
                className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-md"
              >
                <FaFileAlt />
                <span>Photos</span>
              </button>
              <button
                onClick={() => handleAttachmentClick('document')}
                className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-md"
              >
                <FaFileAlt />
                <span>Document</span>
              </button>
              <button
                onClick={() => handleAttachmentClick('contact')}
                className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-md"
              >
                <FaUser />
                <span>Contact</span>
              </button>
            </div>
          )}

          <input
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Type a message..."
            className="flex-1 p-2 bg-white border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <button
            onClick={handleSendMessage}
            className="p-2 bg-blue-500 text-white rounded-full shadow-md hover:bg-blue-600 transition duration-200"
          >
            <FaPaperPlane size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
