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
  deleteDoc,
  getDoc,
  updateDoc,
} from 'firebase/firestore';

import Picker from '@emoji-mart/react';
import { IoSend, IoDocumentTextOutline, IoImageOutline, IoClose } from 'react-icons/io5';
import { useParams } from 'react-router-dom';
import ChatHeader from './ChatHeader'; // Import the new ChatHeader component

const ChatInterface = ({ currentUser }) => {
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [file, setFile] = useState(null);
  const [image, setImage] = useState(null);
  const [chatRoomName, setChatRoomName] = useState('');
  const [chatRoomEmoji, setChatRoomEmoji] = useState('');
  const { chatRoomId } = useParams();
  const db = getFirestore();
  const messagesContainerRef = useRef(null);

  const [deleteMessageId, setDeleteMessageId] = useState(null);
  const [showDeleteIcon, setShowDeleteIcon] = useState(false);

  useEffect(() => {
    if (!chatRoomId) return;

    const fetchChatRoomData = async () => {
      const chatRoomRef = doc(db, 'chatRooms', chatRoomId);
      const chatRoomDoc = await getDoc(chatRoomRef);
      if (chatRoomDoc.exists()) {
        setChatRoomName(chatRoomDoc.data().name || 'Chat Room');
        setChatRoomEmoji(chatRoomDoc.data().emoji || '💬');
      }
    };

    fetchChatRoomData();

    const messagesRef = collection(db, 'chatRooms', chatRoomId, 'messages');
    const q = query(messagesRef, orderBy('createdAt'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(
        snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
      );
      scrollToBottom();
    });

    return () => unsubscribe();
  }, [chatRoomId, db]);

  const handleSendMessage = async () => {
    if (messageInput.trim() === '' && !file && !image) return;

    const messagesRef = collection(db, 'chatRooms', chatRoomId, 'messages');
    await addDoc(messagesRef, {
      text: messageInput,
      senderId: currentUser.uid,
      createdAt: serverTimestamp(),
      file: file ? file.name : null,
      image: image ? image.name : null,
    });

    setMessageInput('');
    setFile(null);
    setImage(null);
  };

  const handleDeleteMessage = async (messageId) => {
    if (window.confirm('Are you sure you want to delete this message?')) {
      const messageRef = doc(db, 'chatRooms', chatRoomId, 'messages', messageId);
      await deleteDoc(messageRef);
      setDeleteMessageId(messageId);
    }
  };

  const handleEmojiSelect = (emoji) => {
    setMessageInput((prev) => prev + emoji.native);
    setShowEmojiPicker(false);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFile(file);
  };

  const handleImageChange = (e) => {
    const image = e.target.files[0];
    setImage(image);
  };

  const scrollToBottom = () => {
    messagesContainerRef.current?.scrollTo({
      top: messagesContainerRef.current.scrollHeight,
      behavior: 'smooth',
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const handleLongPress = (e, messageId) => {
    e.preventDefault();
    setDeleteMessageId(messageId);
    setShowDeleteIcon(true);
  };

  const handleDeleteClick = (messageId) => {
    handleDeleteMessage(messageId);
    setShowDeleteIcon(false);
  };

  const handleSwipeLeft = (e, messageId) => {
    const target = e.target;
    const swipeThreshold = 150;
    let startX;

    const onTouchStart = (touchStartEvent) => {
      startX = touchStartEvent.touches[0].clientX;
    };

    const onTouchMove = (touchMoveEvent) => {
      const diff = startX - touchMoveEvent.touches[0].clientX;
      if (diff > swipeThreshold) {
        target.classList.add('show-timestamp');
      }
    };

    const onTouchEnd = () => {
      target.removeEventListener('touchmove', onTouchMove);
      target.removeEventListener('touchend', onTouchEnd);
    };

    target.addEventListener('touchstart', onTouchStart);
    target.addEventListener('touchmove', onTouchMove);
    target.addEventListener('touchend', onTouchEnd);
  };

  const handleEmojiRoomSelect = (emoji) => {
    setChatRoomEmoji(emoji.native);
    const chatRoomRef = doc(db, 'chatRooms', chatRoomId);
    updateDoc(chatRoomRef, {
      emoji: emoji.native,
    });
  };

  return (
    <div className="flex flex-col h-screen bg-white text-black">
      <ChatHeader chatRoomName={chatRoomName} chatRoomEmoji={chatRoomEmoji} onBack={() => console.log('Go Back')} />

      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-100 rounded-t-2xl shadow-lg sm:p-6">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-start space-x-2 ${
              message.senderId === currentUser.uid ? 'justify-end' : 'justify-start'
            } relative`}
            onContextMenu={(e) => handleLongPress(e, message.id)}
            onTouchStart={(e) => handleSwipeLeft(e, message.id)}
            style={{ opacity: deleteMessageId === message.id ? 0.5 : 1 }}
          >
            <div
              className={`p-3 max-w-[75%] sm:max-w-[65%] rounded-lg shadow-md ${
                message.senderId === currentUser.uid
                  ? 'bg-black text-white'
                  : 'bg-white text-black border border-gray-300'
              }`}
            >
              <p>{message.text}</p>
              {message.file && <p className="text-xs truncate">📄 {message.file}</p>}
              {message.image && <img src={URL.createObjectURL(image)} alt="uploaded" className="rounded-md mt-2 w-full object-contain" />}
              <span className="block text-xs mt-1 text-right opacity-70 timestamp hidden">
                {message.createdAt?.toDate
                  ? new Date(message.createdAt.toDate()).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'Sending...'}
              </span>
              {showDeleteIcon && deleteMessageId === message.id && (
                <button
                  onClick={() => handleDeleteClick(message.id)}
                  className="absolute top-1 right-1 text-red-500 text-xl"
                  style={{ transition: 'transform 0.3s ease-out', transform: 'scale(1.2)' }}
                >
                  <IoClose />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 bg-gray-200 border-t flex items-center gap-2 sm:p-6">
        {showEmojiPicker && (
          <div className="absolute bottom-16 left-4 z-50">
            <Picker onEmojiSelect={handleEmojiSelect} theme="light" />
          </div>
        )}
        <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-2 text-gray-500 hover:text-blue-500 transition-transform duration-300">
          😊
        </button>
        <input
          type="text"
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="flex-1 p-2 text-sm bg-white text-black border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input type="file" id="fileInput" onChange={handleFileChange} className="hidden" />
        <label htmlFor="fileInput" className="p-2 cursor-pointer text-gray-500 hover:text-green-500">
          <IoDocumentTextOutline size={20} />
        </label>
        <input type="file" accept="image/*" id="imageInput" onChange={handleImageChange} className="hidden" />
        <label htmlFor="imageInput" className="p-2 cursor-pointer text-gray-500 hover:text-purple-500">
          <IoImageOutline size={20} />
        </label>
        <button onClick={handleSendMessage} className="p-2 text-gray-500 hover:text-blue-500 transition-transform duration-300 transform hover:scale-125">
          <IoSend size={20} />
        </button>
      </div>
    </div>
  );
};

export default ChatInterface;
