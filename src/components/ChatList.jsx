import React, { useState, useEffect, startTransition } from 'react';
import { db } from './firebaseConfig';
import { collection, query, where, onSnapshot, getDoc, doc, addDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { 
  FiSearch, 
  FiMessageCircle, 
  FiPlus, 
  FiUsers, 
  FiX, 
  FiArrowLeft,
  FiMoreVertical,
  FiPhone,
  FiVideo,
  FiSend
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const ChatListPage = ({ currentUser, isSidebar = false }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [chatRooms, setChatRooms] = useState([]);
  const [users, setUsers] = useState([]);
  const [filteredChatRooms, setFilteredChatRooms] = useState([]);
  const [activeTab, setActiveTab] = useState('chats');
  const [showUsersList, setShowUsersList] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const navigate = useNavigate();

  // Helper function to generate initials from name
  const getInitials = (name) => {
    if (!name) return '??';
    const words = name.trim().split(' ');
    if (words.length === 1) {
      return words[0].charAt(0).toUpperCase();
    }
    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
  };

  // Helper function to generate consistent colors based on name
  const getAvatarColor = (name) => {
    if (!name) return 'bg-gray-500';
    
    const colors = [
      'bg-gradient-to-br from-red-400 to-red-600',
      'bg-gradient-to-br from-blue-400 to-blue-600',
      'bg-gradient-to-br from-green-400 to-green-600',
      'bg-gradient-to-br from-purple-400 to-purple-600',
      'bg-gradient-to-br from-pink-400 to-pink-600',
      'bg-gradient-to-br from-indigo-400 to-indigo-600',
      'bg-gradient-to-br from-yellow-400 to-yellow-600',
      'bg-gradient-to-br from-teal-400 to-teal-600',
      'bg-gradient-to-br from-orange-400 to-orange-600',
      'bg-gradient-to-br from-cyan-400 to-cyan-600',
    ];
    
    const hash = name.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    return colors[Math.abs(hash) % colors.length];
  };

  // Avatar component
  const Avatar = ({ src, name, size = 'md', className = '' }) => {
    const [imageError, setImageError] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);
    
    const sizeClasses = {
      xs: isSidebar ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm',
      sm: isSidebar ? 'w-10 h-10 text-sm' : 'w-12 h-12 text-base',
      md: isSidebar ? 'w-12 h-12 text-sm' : 'w-14 h-14 text-lg',
      lg: isSidebar ? 'w-14 h-14 text-base' : 'w-16 h-16 text-xl',
      xl: isSidebar ? 'w-16 h-16 text-lg' : 'w-20 h-20 text-2xl'
    };

    const shouldShowImage = src && !imageError && src !== '/default-avatar.png';
    const initials = getInitials(name);
    const avatarColor = getAvatarColor(name);

    return (
      <div className={`${sizeClasses[size]} rounded-full overflow-hidden ring-2 ring-gray-100 dark:ring-gray-800 group-hover:ring-blue-200 dark:group-hover:ring-blue-800 transition-all duration-300 ${className}`}>
        {shouldShowImage ? (
          <div className="relative w-full h-full">
            <img
              src={src}
              alt={name}
              className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
              onLoad={() => setImageLoaded(true)}
              onError={() => {
                setImageError(true);
                setImageLoaded(false);
              }}
            />
            {!imageLoaded && (
              <div className={`absolute inset-0 ${avatarColor} flex items-center justify-center text-white font-semibold`}>
                {initials}
              </div>
            )}
          </div>
        ) : (
          <div className={`w-full h-full ${avatarColor} flex items-center justify-center text-white font-semibold shadow-inner`}>
            {initials}
          </div>
        )}
      </div>
    );
  };

  const fetchOtherUserDetails = async (userId) => {
    try {
      if (!userId) return null;
      const userDoc = await getDoc(doc(db, 'users', userId));
      return userDoc.exists() ? userDoc.data() : null;
    } catch (error) {
      console.error('Error fetching user details:', error);
      return null;
    }
  };

  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'chatRooms'),
      where('users', 'array-contains', currentUser.uid)
    );

    const unsubscribeChatRooms = onSnapshot(q, async (snapshot) => {
      const rooms = await Promise.all(snapshot.docs.map(async (doc) => {
        const data = doc.data();
        const otherUser = data.users.find((user) => user !== currentUser.uid);
        if (!otherUser) return null;
        
        const otherUserDetails = await fetchOtherUserDetails(otherUser);
        const unseenMessagesCount = data.messages?.filter(msg => 
          msg.timestamp > (data.lastSeenMessage || 0) && msg.user !== currentUser.uid
        ).length || 0;

        // Get the last message and format it properly
        const lastMessageData = data.messages?.length > 0 ? data.messages[data.messages.length - 1] : null;
        const formattedLastMessage = formatLastMessage(lastMessageData?.text || lastMessageData);

        return {
          id: doc.id,
          otherUser,
          otherUserFullName: otherUserDetails?.fullName || 'Unknown User',
          otherUserAvatar: otherUserDetails?.avatar || otherUserDetails?.photoURL || null,
          lastMessage: formattedLastMessage,
          lastMessageTimestamp: lastMessageData?.timestamp || 0,
          unseenMessagesCount,
          isOnline: Math.random() > 0.5, // Mock online status
          ...data,
        };
      }));

      const sortedRooms = rooms.filter(Boolean).sort((a, b) => b.lastMessageTimestamp - a.lastMessageTimestamp);
      setChatRooms(sortedRooms);
      setFilteredChatRooms(sortedRooms);
    });

    const userQuery = collection(db, 'users');
    const unsubscribeUsers = onSnapshot(userQuery, (snapshot) => {
      const usersList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setUsers(usersList);
    });

    return () => {
      unsubscribeChatRooms();
      unsubscribeUsers();
    };
  }, [currentUser]);

  const handleSearchChange = (event) => {
    const value = event.target.value;
    startTransition(() => {
      setSearchTerm(value);
      filterChatRooms(value);
    });
  };

  const filterChatRooms = (term) => {
    const filteredRooms = chatRooms.filter((room) =>
      room.otherUserFullName.toLowerCase().includes(term.toLowerCase())
    );
    setFilteredChatRooms(filteredRooms);
  };

  const handleChatRoomClick = (roomId) => {
    navigate(`/chat/${roomId}`);
  };

  const createNewChatRoom = async (userId) => {
    try {
      if (!userId) return;
      
      const newChatRoomRef = await addDoc(collection(db, 'chatRooms'), {
        users: [currentUser.uid, userId],
        messages: [],
      });

      navigate(`/chat/${newChatRoomRef.id}`);
    } catch (error) {
      console.error('Error creating new chat room:', error);
    }
  };

  const getAvailableUsers = () => {
    const usersInCurrentChats = chatRooms.map(room => room.otherUser);
    return users.filter(user => !usersInCurrentChats.includes(user.id) && user.id !== currentUser?.uid);
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  // Also update the helper function to handle different message types
  const formatLastMessage = (message) => {
    if (!message) return 'Start a conversation';
    
    // Handle different message types
    if (typeof message === 'object') {
      if (message.text) return message.text;
      if (message.image) return '📷 Photo';
      if (message.file) return '📄 File';
      return 'New message';
    }
    
    return message;
  };

  const ChatCard = ({ room, index }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.3 }}
      onClick={() => handleChatRoomClick(room.id)}
      className={`group relative bg-white dark:bg-gray-900 rounded-xl ${isSidebar ? 'mx-2 p-3 mb-2' : 'mx-3 sm:mx-0 p-4 mb-3'} shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-lg dark:hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-[1.02]`}
    >
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
      
      <div className="relative flex items-center space-x-3">
        {/* Avatar with online status */}
        <div className="relative flex-shrink-0">
          <Avatar 
            src={room.otherUserAvatar} 
            name={room.otherUserFullName}
            size={isSidebar ? 'md' : 'lg'}
          />
          
          {room.isOnline && (
            <div className={`absolute -bottom-1 -right-1 ${isSidebar ? 'w-4 h-4' : 'w-4 h-4 sm:w-5 sm:h-5'} bg-green-400 rounded-full border-2 border-white dark:border-gray-900 shadow-sm`} />
          )}
          {room.unseenMessagesCount > 0 && (
            <div className={`absolute -top-1 -right-1 ${isSidebar ? 'min-w-[16px] h-4' : 'min-w-[18px] h-5'} bg-red-500 rounded-full flex items-center justify-center`}>
              <span className={`${isSidebar ? 'text-xs' : 'text-xs'} font-bold text-white px-1`}>
                {room.unseenMessagesCount > 99 ? '99+' : room.unseenMessagesCount}
              </span>
            </div>
          )}
        </div>

        {/* Chat info - Fixed width to prevent expansion */}
        <div className="flex-1 min-w-0 overflow-hidden">
          <div className="flex items-center justify-between mb-1">
            <h3 className={`${isSidebar ? 'text-sm' : 'text-base sm:text-lg'} font-semibold text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200`}>
              {room.otherUserFullName}
            </h3>
            <span className={`${isSidebar ? 'text-xs' : 'text-xs'} text-gray-400 dark:text-gray-500 flex-shrink-0 ml-2`}>
              {formatTime(room.lastMessageTimestamp)}
            </span>
          </div>
          
          {/* Truncated last message with proper ellipsis */}
          <p className={`${isSidebar ? 'text-xs' : 'text-sm'} text-gray-500 dark:text-gray-400 leading-relaxed overflow-hidden whitespace-nowrap text-ellipsis`}>
            {room.lastMessage && room.lastMessage.length > (isSidebar ? 25 : 40) 
              ? `${room.lastMessage.substring(0, isSidebar ? 25 : 40)}...`
              : room.lastMessage || 'Start a conversation'
            }
          </p>
          
          {/* Online status text - Only show on larger screens or when not sidebar */}
          {room.isOnline && !isSidebar && (
            <div className="flex items-center mt-1">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-2" />
              <span className="text-xs text-green-600 dark:text-green-400 font-medium">Active now</span>
            </div>
          )}
        </div>

        {/* Quick actions - Hide on mobile and sidebar */}
        {!isSidebar && (
          <div className="hidden sm:flex flex-col space-y-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-blue-100 dark:hover:bg-blue-900 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              <FiPhone size={14} />
            </button>
            <button className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-green-100 dark:hover:bg-green-900 text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors">
              <FiVideo size={14} />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );

  const UserCard = ({ user, index }) => (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1, duration: 0.3 }}
      onClick={() => createNewChatRoom(user.id)}
      className={`group bg-white dark:bg-gray-900 rounded-xl ${isSidebar ? 'mx-2 p-3 mb-2' : 'mx-3 sm:mx-0 p-4 mb-3'} shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-lg dark:hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-[1.02]`}
    >
      <div className="flex items-center space-x-3">
        <div className="relative flex-shrink-0">
          <Avatar 
            src={user.avatar || user.photoURL} 
            name={user.fullName}
            size={isSidebar ? 'sm' : 'md'}
            className="group-hover:ring-purple-200 dark:group-hover:ring-purple-800"
          />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className={`${isSidebar ? 'text-sm' : 'text-base'} font-semibold text-gray-900 dark:text-white truncate group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-200`}>
            {user.fullName || 'Unknown User'}
          </h3>
          <p className={`${isSidebar ? 'text-xs' : 'text-sm'} text-gray-500 dark:text-gray-400 truncate`}>
            @{user.username || 'username'}
          </p>
        </div>

        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className={`${isSidebar ? 'w-8 h-8' : 'w-9 h-9 sm:w-10 sm:h-10'} rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white shadow-lg`}>
            <FiSend size={isSidebar ? 12 : 14} />
          </div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className={`${isSidebar ? 'h-full' : 'min-h-screen'} bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-black dark:via-gray-900 dark:to-gray-900`}>
      {/* Enhanced Header */}
      <div className={`${isSidebar ? 'border-b' : 'sticky top-0 z-20'} bg-white/90 dark:bg-black/90 backdrop-blur-xl border-gray-200 dark:border-gray-800`}>
        <div className={`${isSidebar ? 'px-4 py-3' : 'px-4 sm:px-6 py-4'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`${isSidebar ? 'w-8 h-8' : 'w-10 h-10'} bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center`}>
                <FiMessageCircle size={isSidebar ? 16 : 20} className="text-white" />
              </div>
              <div>
                <h1 className={`${isSidebar ? 'text-lg' : 'text-xl sm:text-2xl'} font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent`}>
                  Messages
                </h1>
                {!isSidebar && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {chatRooms.length} conversation{chatRooms.length !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </div>

            {/* Tab switcher */}
            <div className={`flex bg-gray-100 dark:bg-gray-800 rounded-lg ${isSidebar ? 'p-0.5' : 'p-1'}`}>
              <button
                onClick={() => setShowUsersList(false)}
                className={`${isSidebar ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 sm:px-4 sm:py-2 text-sm'} rounded-lg font-medium transition-all duration-200 ${
                  !showUsersList
                    ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                Chats
              </button>
              <button
                onClick={() => setShowUsersList(true)}
                className={`${isSidebar ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 sm:px-4 sm:py-2 text-sm'} rounded-lg font-medium transition-all duration-200 ${
                  showUsersList
                    ? 'bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                People
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Search Bar */}
      <div className={`${isSidebar ? 'px-3 py-2' : 'px-4 sm:px-6 py-4'}`}>
        <div className={`relative transition-all duration-300 ${isSearchFocused ? 'scale-[1.02]' : ''}`}>
          <div className={`absolute ${isSidebar ? 'left-3' : 'left-4'} top-1/2 transform -translate-y-1/2 text-gray-400`}>
            <FiSearch size={isSidebar ? 16 : 20} />
          </div>
          <input
            type="text"
            className={`w-full ${isSidebar ? 'pl-10 pr-3 py-2.5 text-sm' : 'pl-12 pr-4 py-3 sm:py-4'} bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl sm:rounded-2xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-sm`}
            placeholder={showUsersList ? "Search people..." : "Search conversations..."}
            value={searchTerm}
            onChange={handleSearchChange}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
          />
          {searchTerm && (
            <button
              onClick={() => {
                setSearchTerm('');
                filterChatRooms('');
              }}
              className={`absolute ${isSidebar ? 'right-3' : 'right-4'} top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300`}
            >
              <FiX size={isSidebar ? 16 : 20} />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className={`${isSidebar ? 'pb-4' : 'pb-24'} ${!isSidebar && 'px-0 sm:px-6'}`}>
        <AnimatePresence mode="wait">
          {!showUsersList ? (
            <motion.div
              key="chats"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {filteredChatRooms.length > 0 ? (
                <div className="space-y-1">
                  {filteredChatRooms.map((room, index) => (
                    <ChatCard key={room.id} room={room} index={index} />
                  ))}
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`text-center ${isSidebar ? 'py-8' : 'py-12'} px-4`}
                >
                  <div className={`${isSidebar ? 'w-16 h-16' : 'w-20 h-20 sm:w-24 sm:h-24'} bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-full flex items-center justify-center mx-auto mb-4`}>
                    <FiMessageCircle size={isSidebar ? 24 : 32} className="text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className={`${isSidebar ? 'text-base' : 'text-lg sm:text-xl'} font-semibold text-gray-900 dark:text-white mb-2`}>
                    {searchTerm ? 'No chats found' : 'No conversations yet'}
                  </h3>
                  <p className={`${isSidebar ? 'text-sm' : 'text-base'} text-gray-500 dark:text-gray-400 mb-6`}>
                    {searchTerm 
                      ? 'Try searching with a different name' 
                      : 'Start a conversation with someone new!'
                    }
                  </p>
                  {!searchTerm && !isSidebar && (
                    <button
                      onClick={() => setShowUsersList(true)}
                      className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg transition-all duration-200"
                    >
                      Find People
                    </button>
                  )}
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="users"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              {getAvailableUsers().length > 0 ? (
                <div className="space-y-1">
                  {getAvailableUsers().map((user, index) => (
                    <UserCard key={user.id} user={user} index={index} />
                  ))}
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`text-center ${isSidebar ? 'py-8' : 'py-12'} px-4`}
                >
                  <div className={`${isSidebar ? 'w-16 h-16' : 'w-20 h-20 sm:w-24 sm:h-24'} bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 rounded-full flex items-center justify-center mx-auto mb-4`}>
                    <FiUsers size={isSidebar ? 24 : 32} className="text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className={`${isSidebar ? 'text-base' : 'text-lg sm:text-xl'} font-semibold text-gray-900 dark:text-white mb-2`}>
                    No new people to chat with
                  </h3>
                  <p className={`${isSidebar ? 'text-sm' : 'text-base'} text-gray-500 dark:text-gray-400`}>
                    You're already connected with everyone!
                  </p>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Enhanced Floating Action Button - Only show when not used as sidebar */}
      {!isSidebar && (
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowUsersList(!showUsersList)}
          className="fixed bottom-6 right-6 w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center justify-center z-30"
        >
          <AnimatePresence mode="wait">
            {showUsersList ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <FiArrowLeft size={20} />
              </motion.div>
            ) : (
              <motion.div
                key="add"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <FiPlus size={20} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      )}
    </div>
  );
};

export default ChatListPage;