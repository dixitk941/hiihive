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
  const [participantId, setParticipantId] = useState(null);
  const { chatRoomId } = useParams();
  const db = getFirestore();
  const messagesContainerRef = useRef(null);

  // Fetch participant ID based on the chatRoomId
  useEffect(() => {
    const fetchParticipantId = async () => {
      if (!chatRoomId) return;

      const chatRoomRef = doc(db, 'chatRooms', chatRoomId);
      try {
        const chatRoomDoc = await getDoc(chatRoomRef);
        if (chatRoomDoc.exists()) {
          const chatRoomData = chatRoomDoc.data();
          const participants = chatRoomData.participants || [];
          const otherParticipantId = participants.find((id) => id !== currentUser.uid);
          setParticipantId(otherParticipantId || null);
        } else {
          console.error('Chat room not found.');
        }
      } catch (error) {
        console.error('Error fetching chat room:', error);
      }
    };

    fetchParticipantId();
  }, [chatRoomId, currentUser.uid, db]);

  // Fetch messages and listen for real-time updates
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

      setMessages(messagesList);
      scrollToBottom();
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
      createdAt: serverTimestamp(),
    });

    setMessageInput('');
  };

  const handleAttachmentClick = async (type) => {
    setShowAttachmentOptions(false);

    if (type === 'camera') {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        alert('Camera access successful!');
        stream.getTracks().forEach((track) => track.stop());
      } catch (err) {
        alert('Camera access denied!');
      }
    } else {
      const input = document.createElement('input');
      input.type = 'file';
      if (type === 'photos') {
        input.accept = 'image/*';
      } else if (type === 'document') {
        input.accept = '*/*';
      } else if (type === 'contact') {
        input.accept = 'text/vcard';
      }
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          alert(`File selected: ${file.name}`);
        }
      };
      input.click();
    }
  };

  const scrollToBottom = () => {
    messagesContainerRef.current?.scrollTo({
      top: messagesContainerRef.current.scrollHeight,
      behavior: 'smooth',
    });
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Pass participantId to ChatHeader */}
      <ChatHeader participantId={participantId} />

      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-white"
      >
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.senderId === currentUser.uid ? 'justify-end' : 'justify-start'
            }`}
          >
            <div className="p-3 max-w-[75%] rounded-lg shadow-md bg-gray-200 text-gray-800">
              <p>{message.text}</p>
              <span className="block text-xs mt-1 text-right opacity-70">
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
      </div>

      <div className="p-3 bg-gray-200 border-t">
        <div className="relative flex items-center">
          <button
            onClick={() => setShowAttachmentOptions(!showAttachmentOptions)}
            className="p-2 bg-gray-300 rounded-full hover:bg-gray-400"
          >
            <FaPaperclip size={18} />
          </button>

          {showAttachmentOptions && (
            <div className="absolute bottom-16 left-4 bg-white p-3 rounded-lg shadow-md space-y-2 z-50">
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
            className="flex-1 p-2 mx-2 bg-white border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
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
