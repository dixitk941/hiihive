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
import { 
  IoSend, 
  IoDocumentTextOutline, 
  IoImageOutline, 
  IoClose, 
  IoAdd,
  IoMicOutline,
  IoCallOutline,
  IoVideocamOutline,
  IoEllipsisVerticalOutline,
  IoArrowBackOutline,
  IoCheckmarkDoneOutline,
  IoCheckmarkOutline,
  IoTimeOutline
} from 'react-icons/io5';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { format, isToday, isYesterday, differenceInDays } from 'date-fns';

const ChatInterface = ({ currentUser }) => {
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [file, setFile] = useState(null);
  const [image, setImage] = useState(null);
  const [fileUploadProgress, setFileUploadProgress] = useState(0);
  const [chatRoomName, setChatRoomName] = useState('');
  const [otherUser, setOtherUser] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const { chatRoomId } = useParams();
  const [userAvatars, setUserAvatars] = useState({});
  const db = getFirestore();
  const storage = getStorage();
  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Theme detection
  useEffect(() => {
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDarkMode(darkModeMediaQuery.matches);
    const handleChange = (e) => setIsDarkMode(e.matches);
    darkModeMediaQuery.addEventListener('change', handleChange);
    return () => darkModeMediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Fetch chat data and messages
  useEffect(() => {
    if (!chatRoomId) return;

    const fetchChatRoomData = async () => {
      const chatRoomRef = doc(db, 'chatRooms', chatRoomId);
      const chatRoomDoc = await getDoc(chatRoomRef);
      
      if (chatRoomDoc.exists()) {
        const chatData = chatRoomDoc.data();
        const otherUserId = chatData.users?.find(uid => uid !== currentUser?.uid);
        
        if (otherUserId) {
          const userRef = doc(db, 'users', otherUserId);
          const userDoc = await getDoc(userRef);
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setOtherUser({ id: otherUserId, ...userData });
            setChatRoomName(userData.fullName || 'Unknown User');
            setIsOnline(Math.random() > 0.5); // Mock online status
          }
        }
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
  }, [chatRoomId, db, currentUser]);

  // Format timestamp for Samsung-like display
  const formatMessageTime = (timestamp) => {
    if (!timestamp) return '';
    
    let date;
    if (timestamp?.toDate) {
      date = timestamp.toDate();
    } else if (timestamp?.seconds) {
      date = new Date(timestamp.seconds * 1000);
    } else {
      date = new Date(timestamp);
    }

    return format(date, 'HH:mm');
  };

  const formatDateHeader = (timestamp) => {
    if (!timestamp) return '';
    
    let date;
    if (timestamp?.toDate) {
      date = timestamp.toDate();
    } else if (timestamp?.seconds) {
      date = new Date(timestamp.seconds * 1000);
    } else {
      date = new Date(timestamp);
    }

    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    if (differenceInDays(new Date(), date) < 7) {
      return format(date, 'EEEE');
    }
    return format(date, 'MMM dd, yyyy');
  };

  const handleSendMessage = async () => {
    if (messageInput.trim() === '' && !file && !image) return;

    const messagesRef = collection(db, 'chatRooms', chatRoomId, 'messages');
    const chatRoomRef = doc(db, 'chatRooms', chatRoomId);

    let fileUrl = null;
    let imageUrl = null;

    // Handle file upload
    if (file) {
      const fileRef = ref(storage, `chatFiles/${Date.now()}-${file.name}`);
      const uploadTask = uploadBytesResumable(fileRef, file);
      
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setFileUploadProgress(progress);
        },
        (error) => console.error('File upload failed', error),
        async () => {
          fileUrl = await getDownloadURL(uploadTask.snapshot.ref);
          await sendMessage(fileUrl, imageUrl);
        }
      );
    }

    // Handle image upload
    if (image) {
      const imageRef = ref(storage, `chatImages/${Date.now()}-${image.name}`);
      const uploadTask = uploadBytesResumable(imageRef, image);
      
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setFileUploadProgress(progress);
        },
        (error) => console.error('Image upload failed', error),
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
    const messagesRef = collection(db, 'chatRooms', chatRoomId, 'messages');
    const chatRoomRef = doc(db, 'chatRooms', chatRoomId);

    const newMessage = {
      text: messageInput,
      senderId: currentUser.uid,
      createdAt: serverTimestamp(),
      file: fileUrl,
      image: imageUrl,
      status: 'sent', // sent, delivered, read
    };

    await addDoc(messagesRef, newMessage);
    await updateDoc(chatRoomRef, {
      lastMessage: messageInput || 'Media',
      lastMessageTimestamp: serverTimestamp(),
    });

    setMessageInput('');
    setFile(null);
    setImage(null);
    setFileUploadProgress(0);
    setShowAttachMenu(false);
  };

  const scrollToBottom = () => {
    messagesContainerRef.current?.scrollTo({
      top: messagesContainerRef.current.scrollHeight,
      behavior: 'smooth',
    });
  };

  const handleEmojiSelect = (emoji) => {
    setMessageInput((prev) => prev + emoji.native);
    setShowEmojiPicker(false);
  };

  const renderMessageStatus = (message) => {
    if (message.senderId !== currentUser.uid) return null;
    
    const iconClass = "w-4 h-4";
    
    switch (message.status) {
      case 'sent':
        return <IoCheckmarkOutline className={`${iconClass} text-gray-400`} />;
      case 'delivered':
        return <IoCheckmarkDoneOutline className={`${iconClass} text-gray-400`} />;
      case 'read':
        return <IoCheckmarkDoneOutline className={`${iconClass} text-blue-500`} />;
      default:
        return <IoTimeOutline className={`${iconClass} text-gray-400`} />;
    }
  };

  const groupMessagesByDate = (messages) => {
    const groups = [];
    let currentGroup = null;

    messages.forEach((message) => {
      const messageDate = message.createdAt ? formatDateHeader(message.createdAt) : 'Today';
      
      if (!currentGroup || currentGroup.date !== messageDate) {
        currentGroup = { date: messageDate, messages: [] };
        groups.push(currentGroup);
      }
      
      currentGroup.messages.push(message);
    });

    return groups;
  };

  const AttachmentMenu = () => (
    <AnimatePresence>
      {showAttachMenu && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 10 }}
          className="absolute bottom-16 left-2 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-4 min-w-[200px]"
        >
          <div className="grid grid-cols-2 gap-3">
            <label htmlFor="imageInput" className="flex flex-col items-center p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mb-2">
                <IoImageOutline size={24} className="text-white" />
              </div>
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Photo</span>
            </label>
            
            <label htmlFor="fileInput" className="flex flex-col items-center p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mb-2">
                <IoDocumentTextOutline size={24} className="text-white" />
              </div>
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">File</span>
            </label>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-black">
      {/* Samsung-style Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => navigate('/chatlist')}
              className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <IoArrowBackOutline size={24} className="text-gray-700 dark:text-gray-300" />
            </button>
            
            <div className="flex items-center space-x-3">
              <div className="relative">
                <img
                  src={otherUser?.avatar || '/default-avatar.png'}
                  alt={chatRoomName}
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-white dark:ring-gray-800"
                />
                {isOnline && (
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full"></div>
                )}
              </div>
              
              <div className="flex-1">
                <h2 className="font-semibold text-lg text-gray-900 dark:text-white">
                  {chatRoomName}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {isOnline ? 'Active now' : 'Last seen recently'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <IoCallOutline size={24} className="text-gray-700 dark:text-gray-300" />
            </button>
            <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <IoVideocamOutline size={24} className="text-gray-700 dark:text-gray-300" />
            </button>
            <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <IoEllipsisVerticalOutline size={24} className="text-gray-700 dark:text-gray-300" />
            </button>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
        style={{ paddingBottom: '120px' }}
      >
        {groupMessagesByDate(messages).map((group, groupIndex) => (
          <div key={groupIndex}>
            {/* Date Header */}
            <div className="flex justify-center my-6">
              <div className="bg-gray-200 dark:bg-gray-700 px-4 py-2 rounded-full">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {group.date}
                </span>
              </div>
            </div>
            
            {/* Messages */}
            {group.messages.map((message, index) => {
              const isOwn = message.senderId === currentUser.uid;
              const showAvatar = !isOwn && (index === 0 || group.messages[index - 1]?.senderId !== message.senderId);
              
              return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-1`}
                >
                  <div className={`flex max-w-[80%] ${isOwn ? 'flex-row-reverse' : 'flex-row'} items-end space-x-2`}>
                    {/* Avatar */}
                    {!isOwn && (
                      <div className="flex-shrink-0 w-8 h-8">
                        {showAvatar ? (
                          <img
                            src={otherUser?.avatar || '/default-avatar.png'}
                            alt="avatar"
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : null}
                      </div>
                    )}
                    
                    {/* Message Bubble */}
                    <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                      <div
                        className={`px-4 py-3 rounded-2xl max-w-full break-words ${
                          isOwn
                            ? 'bg-blue-500 text-white rounded-br-md'
                            : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-bl-md'
                        }`}
                      >
                        {message.text && (
                          <p className="text-base leading-relaxed whitespace-pre-wrap">
                            {message.text}
                          </p>
                        )}
                        
                        {message.image && (
                          <div className="mt-2">
                            <img
                              src={message.image}
                              alt="shared"
                              className="max-w-full h-auto rounded-xl shadow-sm"
                            />
                          </div>
                        )}
                        
                        {message.file && (
                          <div className="mt-2 p-3 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center space-x-3">
                            <IoDocumentTextOutline size={24} className="text-blue-500" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">Document</p>
                              <p className="text-xs text-gray-500">Tap to download</p>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Message info */}
                      <div className={`flex items-center space-x-1 mt-1 ${isOwn ? 'flex-row-reverse space-x-reverse' : ''}`}>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatMessageTime(message.createdAt)}
                        </span>
                        {renderMessageStatus(message)}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ))}
        
        {/* Typing indicator */}
        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center space-x-2"
          >
            <img
              src={otherUser?.avatar || '/default-avatar.png'}
              alt="avatar"
              className="w-8 h-8 rounded-full"
            />
            <div className="bg-gray-200 dark:bg-gray-700 px-4 py-3 rounded-2xl rounded-bl-md">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Samsung-style Input Area */}
      <div className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 p-4">
        {/* File/Image Preview */}
        <AnimatePresence>
          {(file || image) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-3 p-3 bg-gray-100 dark:bg-gray-800 rounded-xl"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {image ? (
                    <>
                      <img src={URL.createObjectURL(image)} alt="preview" className="w-12 h-12 rounded-lg object-cover" />
                      <span className="text-sm font-medium">{image.name}</span>
                    </>
                  ) : (
                    <>
                      <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                        <IoDocumentTextOutline size={24} className="text-white" />
                      </div>
                      <span className="text-sm font-medium">{file?.name}</span>
                    </>
                  )}
                </div>
                <button
                  onClick={() => {
                    setFile(null);
                    setImage(null);
                  }}
                  className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  <IoClose size={20} className="text-gray-500" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input Row */}
        <div className="flex items-end space-x-3">
          {/* Attach Button */}
          <div className="relative">
            <button
              onClick={() => setShowAttachMenu(!showAttachMenu)}
              className="p-3 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <IoAdd size={24} className="text-gray-600 dark:text-gray-400" />
            </button>
            <AttachmentMenu />
          </div>

          {/* Text Input */}
          <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-end">
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-3 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              <span className="text-xl">😊</span>
            </button>
            
            <textarea
              ref={inputRef}
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 bg-transparent border-none outline-none py-3 px-2 text-gray-900 dark:text-white placeholder-gray-500 resize-none max-h-32"
              rows="1"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            
            <button className="p-3 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
              <IoMicOutline size={24} />
            </button>
          </div>

          {/* Send Button */}
          <button
            onClick={handleSendMessage}
            disabled={!messageInput.trim() && !file && !image}
            className={`p-3 rounded-full transition-all ${
              messageInput.trim() || file || image
                ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
            }`}
          >
            <IoSend size={24} />
          </button>
        </div>

        {/* Emoji Picker */}
        <AnimatePresence>
          {showEmojiPicker && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-24 left-4 z-50"
            >
              <Picker 
                onEmojiSelect={handleEmojiSelect} 
                theme={isDarkMode ? 'dark' : 'light'}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Hidden file inputs */}
      <input
        id="fileInput"
        type="file"
        className="hidden"
        onChange={(e) => setFile(e.target.files[0])}
      />
      <input
        id="imageInput"
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => setImage(e.target.files[0])}
      />
    </div>
  );
};

export default ChatInterface;