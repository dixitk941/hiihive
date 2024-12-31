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
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import Picker from '@emoji-mart/react';
import { IoSend, IoDocumentTextOutline, IoImageOutline, IoClose } from 'react-icons/io5';
import { useParams } from 'react-router-dom';
import ChatHeader from './ChatHeader';
import { format } from 'date-fns';

const formatTimestamp = (timestamp) => {
  if (!timestamp) return ''; // Handle missing timestamp
  const date = timestamp.toDate(); // Convert Firestore Timestamp to JS Date
  return format(date, "dd MMM yyyy, h:mm a"); // Example: "24 Dec 2024, 3:45 PM"
};


const ChatInterface = ({ currentUser }) => {
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [file, setFile] = useState(null);
  const [image, setImage] = useState(null);
  const [fileUploadProgress, setFileUploadProgress] = useState(0);
  const [chatRoomName, setChatRoomName] = useState('');
  const [chatRoomEmoji, setChatRoomEmoji] = useState('');
  const { chatRoomId } = useParams(); // Get chatRoomId from URL params
  const [currentChatRoomId, setChatRoomId] = useState(chatRoomId || ''); // State for chatRoomId
  const [userAvatars, setUserAvatars] = useState({}); // Store user avatars
  const db = getFirestore();
  const storage = getStorage();
  const messagesContainerRef = useRef(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    if (!currentChatRoomId) return;

    const fetchChatRoomData = async () => {
      const chatRoomRef = doc(db, 'chatRooms', currentChatRoomId);
      const chatRoomDoc = await getDoc(chatRoomRef);
      
      if (chatRoomDoc.exists()) {
        setChatRoomName(chatRoomDoc.data().name || 'Chat Room');
        setChatRoomEmoji(chatRoomDoc.data().emoji || '💬');
      }
    };

    fetchChatRoomData();

    const messagesRef = collection(db, 'chatRooms', currentChatRoomId, 'messages');
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
  }, [currentChatRoomId, db]);

  useEffect(() => {
    // Fetch user avatars when messages are received
    const fetchUserAvatars = async () => {
      const avatars = {};
      for (const message of messages) {
        if (message.senderId && !avatars[message.senderId]) {
          const userRef = doc(db, 'users', message.senderId);
          const userDoc = await getDoc(userRef);
          if (userDoc.exists()) {
            avatars[message.senderId] = userDoc.data().avatar || 'default-avatar-url';
          }
        }
      }
      setUserAvatars(avatars);
    };

    fetchUserAvatars();
  }, [messages, db]);

  const handleSendMessage = async () => {
    if (messageInput.trim() === '' && !file && !image) return;

    const messagesRef = collection(db, 'chatRooms', currentChatRoomId, 'messages');
    const chatRoomRef = doc(db, 'chatRooms', currentChatRoomId);

    let fileUrl = null;
    let imageUrl = null;

    // Upload file to Firebase Storage
    if (file) {
      const fileRef = ref(storage, `chatFiles/${Date.now()}-${file.name}`);
      const uploadTask = uploadBytesResumable(fileRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setFileUploadProgress(progress);
        },
        (error) => {
          console.error('File upload failed', error);
        },
        async () => {
          fileUrl = await getDownloadURL(uploadTask.snapshot.ref);
          await sendMessage(fileUrl, imageUrl);
        }
      );
    }

    // Upload image to Firebase Storage
    if (image) {
      const imageRef = ref(storage, `chatImages/${Date.now()}-${image.name}`);
      const uploadTask = uploadBytesResumable(imageRef, image);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setFileUploadProgress(progress);
        },
        (error) => {
          console.error('Image upload failed', error);
        },
        async () => {
          imageUrl = await getDownloadURL(uploadTask.snapshot.ref);
          await sendMessage(fileUrl, imageUrl);
        }
      );
    }

    if (!file && !image) {
      await sendMessage(fileUrl, imageUrl);
    }
  };

  const sendMessage = async (fileUrl, imageUrl) => {
    const messagesRef = collection(db, 'chatRooms', currentChatRoomId, 'messages');
    const chatRoomRef = doc(db, 'chatRooms', currentChatRoomId);

    const newMessage = {
      text: messageInput,
      senderId: currentUser.uid,
      createdAt: serverTimestamp(),
      file: fileUrl,
      image: imageUrl,
      seen: false, // Add seen field
    };

    const messageDocRef = await addDoc(messagesRef, newMessage);

    // Update the chat room document with the last message and seen status
    await updateDoc(chatRoomRef, {
      lastMessage: newMessage.text,
      lastMessageTimestamp: serverTimestamp(),
      lastMessageSeen: false,
    });

    setMessageInput('');
    setFile(null);
    setImage(null);
    setFileUploadProgress(0);
  };

  const handleDeleteMessage = async (messageId) => {
    if (window.confirm('Are you sure you want to delete this message?')) {
      const messageRef = doc(db, 'chatRooms', currentChatRoomId, 'messages', messageId);
      await deleteDoc(messageRef);
    }
  };
  const formatTimestamp = (timestamp) => {
    let date;

    if (timestamp?.toDate) {
        // Firestore Timestamp
        date = timestamp.toDate();
    } else if (timestamp?.seconds) {
        // Plain object with seconds
        date = new Date(timestamp.seconds * 1000);
    } else if (typeof timestamp === "string") {
        // String timestamp
        date = new Date(timestamp);
    } else {
        // Fallback for invalid timestamps
        return "Invalid time";
    }

    // Format to "hh:mm AM/PM"
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
};

  const handleLongClick = (e, messageId) => {
    e.preventDefault();
    handleDeleteMessage(messageId);
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

  const renderMessageText = (text) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.split(urlRegex).map((part, index) =>
      urlRegex.test(part) ? (
        <a key={index} href={part} className="text-blue-600" target="_blank" rel="noopener noreferrer">
          {part}
        </a>
      ) : (
        part
      )
    );
  };

  const forceDownload = (url, fileName) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderFileLink = (fileUrl) => {
    const fileExtension = fileUrl.split('.').pop();
    const isDownloadable = fileExtension === 'txt' || fileExtension === 'pdf';
    const fileName = fileUrl.split('/').pop().split('?')[0]; // Extract the file name from the URL

    if (isDownloadable) {
      return (
        <button
          onClick={() => forceDownload(fileUrl, fileName)}
          className="text-xs truncate text-blue-600"
        >
          📄 File
        </button>
      );
    }

    return (
      <a
        href={fileUrl}
        className="text-xs truncate text-blue-600"
        target="_blank"
        rel="noopener noreferrer"
      >
        📄 File
      </a>
    );
  };
  useEffect(() => {
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDarkMode(darkModeMediaQuery.matches);

    const handleChange = (e) => setIsDarkMode(e.matches);
    darkModeMediaQuery.addEventListener('change', handleChange);

    return () => darkModeMediaQuery.removeEventListener('change', handleChange);
  }, []);
  const themeClasses = isDarkMode
    ? {
        bg: 'bg-black',
        text: 'text-white',
        border: 'border-gray-700',
        shadow: 'shadow-md',
        input: 'bg-gray-800 text-white border-gray-600 focus:ring-blue-500',
        emojiPicker: 'dark',
      }
    : {
        bg: 'bg-white',
        text: 'text-black',
        border: 'border-gray-300',
        shadow: 'shadow-xl',
        input: 'bg-white text-black border-gray-300 focus:ring-blue-300',
        emojiPicker: 'light',
      };


  return (

      <div className={`flex flex-col h-screen ${themeClasses.bg} ${themeClasses.text}`}>
        {/* Fixed Header */}
        <div
          className={`fixed top-0 left-0 w-full sm:left-[20%] sm:w-[80%] z-10 ${themeClasses.bg} ${themeClasses.shadow}`}
        >
          <ChatHeader
            chatRoomName={chatRoomName}
            chatRoomEmoji={chatRoomEmoji}
            chatRoomId={currentChatRoomId}
            currentUser={currentUser}
            onBack={() => console.log('Go Back')}
          />
        </div>
  
        {/* Chat Messages */}
        <div className="flex flex-col h-screen">
          <div className="flex-1 overflow-y-auto p-4" style={{ marginBottom: '3rem' }}>
            {messages.map((message) => (
              <div
                key={message.id}
                onContextMenu={(e) => handleLongClick(e, message.id)}
                className={`flex items-start space-x-2 ${
                  message.senderId === currentUser.uid ? 'justify-end' : 'justify-start'
                } relative`}
              >
                <div className="flex items-center space-x-2">
                  <img
                    src={userAvatars[message.senderId] || 'default-avatar-url'}
                    alt="avatar"
                    className="w-8 h-8 rounded-full"
                  />
                  <div
                    className={`p-3 max-w-[75%] sm:max-w-[65%] rounded-lg shadow-md ${
                      message.senderId === currentUser.uid
                        ? `${themeClasses.bg} ${themeClasses.text}`
                        : `${themeClasses.bg} ${themeClasses.text} ${themeClasses.border}`
                    }`}
                  >
                    <p>{renderMessageText(message.text)}</p>
                    {message.file && renderFileLink(message.file)}
                    {message.image && (
                      <img
                        src={message.image}
                        alt="uploaded"
                        className="rounded-md mt-2 w-full object-contain"
                      />
                    )}
                    <span className="text-xs text-gray-500 mt-1 block">
                      {message.createdAt ? formatTimestamp(message.createdAt) : 'Sending...'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
  
          {/* Input Section */}
          <div
            className={`fixed bottom-0 left-0 w-full sm:left-[20%] sm:w-[80%] p-2 ${themeClasses.bg} ${themeClasses.border} flex flex-col gap-2 sm:p-3 rounded-t-lg ${themeClasses.shadow} z-10`}
          >
            {/* File and Image preview */}
            {file && (
              <div className="flex items-center space-x-2 mb-2">
                <IoDocumentTextOutline size={24} className={themeClasses.text} />
                <span className={`text-sm ${themeClasses.text}`}>{file.name}</span>
                <button onClick={() => setFile(null)} className="text-red-500">
                  <IoClose size={24} />
                </button>
              </div>
            )}
            {image && (
              <div className="flex items-center space-x-2 mb-2">
                <img src={URL.createObjectURL(image)} alt="preview" className="w-10 h-10 object-cover rounded" />
                <span className={`text-sm ${themeClasses.text}`}>{image.name}</span>
                <button onClick={() => setImage(null)} className="text-red-500">
                  <IoClose size={24} />
                </button>
              </div>
            )}
  
            {/* Input Area */}
            <div className="flex items-center gap-2">
              {showEmojiPicker && (
                <div className="absolute bottom-16 left-4 z-50">
                  <Picker onEmojiSelect={handleEmojiSelect} theme={themeClasses.emojiPicker} />
                </div>
              )}
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className={`p-2 ${themeClasses.text} hover:text-blue-500`}
              >
                😊
              </button>
              <textarea
                placeholder="Type a message..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                className={`w-full px-4 py-2 rounded-lg border ${themeClasses.input} resize-none`}
                rows="2"
                onKeyDown={handleKeyDown}
              ></textarea>
              <label htmlFor="fileInput">
                <IoDocumentTextOutline size={24} className={`${themeClasses.text} cursor-pointer hover:text-blue-500`} />
              </label>
              <label htmlFor="imageInput">
                <IoImageOutline size={24} className={`${themeClasses.text} cursor-pointer hover:text-blue-500`} />
              </label>
              <button onClick={handleSendMessage} className="p-2 text-white bg-blue-500 rounded-full hover:bg-blue-600">
                <IoSend size={24} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  export default ChatInterface;
  