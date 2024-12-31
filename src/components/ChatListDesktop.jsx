import React, { useState, useEffect, startTransition } from 'react';
import { db } from './firebaseConfig'; // Import your Firebase config
import { collection, query, where, onSnapshot, getDoc, doc, addDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom'; // For navigation
import { getAuth } from 'firebase/auth';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons'; // Import faPlus icon
import Header from './Header'; // Import your Header component

const ChatListPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [chatRooms, setChatRooms] = useState([]);
  const [users, setUsers] = useState([]); // List of all users for creating a new chat
  const [filteredChatRooms, setFilteredChatRooms] = useState([]);
  const [activeTab, setActiveTab] = useState('chats'); // State to track active tab
  const [showUsersList, setShowUsersList] = useState(false); // Show/hide users list
  const navigate = useNavigate();
  const currentUser = getAuth().currentUser;

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

    // Fetch chat rooms where the current user is part of the users array
    const q = query(
      collection(db, 'chatRooms'),
      where('users', 'array-contains', currentUser.uid)
    );

    const unsubscribeChatRooms = onSnapshot(q, async (snapshot) => {
      const rooms = await Promise.all(snapshot.docs.map(async (doc) => {
        const data = doc.data();
        const otherUser = data.users.find((user) => user !== currentUser.uid);
        if (!otherUser) {
          console.warn('No other user found in chat room:', doc.id);
          return null;
        }
        const otherUserDetails = await fetchOtherUserDetails(otherUser);
        
        // Check for unseen messages
        const unseenMessagesCount = data.messages.filter(msg => 
          msg.timestamp > (data.lastSeenMessage || 0) && msg.user !== currentUser.uid
        ).length;

        return {
          id: doc.id,
          otherUser,
          otherUserFullName: otherUserDetails?.fullName || 'Unknown User',
          otherUserAvatar: otherUserDetails?.avatar || '/default-avatar.png',
          lastMessage: data.messages.length > 0 ? data.messages[data.messages.length - 1].text : 'No messages yet',
          lastMessageTimestamp: data.messages.length > 0 ? data.messages[data.messages.length - 1].timestamp : 0,
          unseenMessagesCount,
          ...data,
        };
      }));

      // Sort chat rooms by the last message timestamp (most recent first)
      const sortedRooms = rooms.filter(Boolean).sort((a, b) => b.lastMessageTimestamp - a.lastMessageTimestamp);
      setChatRooms(sortedRooms);
      setFilteredChatRooms(sortedRooms); // Initially set filtered chat rooms to all
    });

    // Fetch all users (for new chat)
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

  // Filter chat rooms based on search term
  const handleSearchChange = (event) => {
    const value = event.target.value;
    startTransition(() => {
      setSearchTerm(value);
      filterChatRooms(value);
    });
  };

  const filterChatRooms = (term) => {
    // Filter chat rooms
    const filteredRooms = chatRooms.filter((room) =>
      room.otherUserFullName.toLowerCase().includes(term.toLowerCase())
    );
    setFilteredChatRooms(filteredRooms);
  };

  const handleChatRoomClick = (roomId) => {
    navigate(`/chat/${roomId}`); // Navigate to the chat room page
  };

  // Create a new chat room
  const createNewChatRoom = async (userId) => {
    try {
      if (!userId) return;
      
      // Create a new chat room with the selected user
      const newChatRoomRef = await addDoc(collection(db, 'chatRooms'), {
        users: [currentUser.uid, userId],
        messages: [],
      });

      // Navigate to the new chat room
      navigate(`/chat/${newChatRoomRef.id}`);
    } catch (error) {
      console.error('Error creating new chat room:', error);
    }
  };

  // Exclude users who are already in the current chat rooms
  const getAvailableUsers = () => {
    const usersInCurrentChats = chatRooms.map(room => room.otherUser);
    return users.filter(user => !usersInCurrentChats.includes(user.id));
  };

  const renderChats = () => (
    <div className="w-full max-w-md mt-4 mb-16">
      {filteredChatRooms.length > 0 ? (
        filteredChatRooms.map((room) => (
          <div
            key={room.id}
            className="relative flex items-center p-4 bg-white shadow-sm rounded-lg mb-2 hover:bg-gray-200 transition cursor-pointer border border-black"
            onClick={() => handleChatRoomClick(room.id)}
          >
            {/* Avatar */}
            <img
              src={room.otherUserAvatar || '/default-avatar.png'}
              alt="Avatar"
              className="w-12 h-12 rounded-full mr-4 shadow-lg"
            />
  
            {/* Chat Info */}
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-800">
                {room.otherUserFullName || 'Unknown User'}
              </h3>
              <p className="text-sm text-gray-500 truncate">
                {room.lastMessage || 'No messages yet'}
              </p>
            </div>
  
            {/* Red Dot for Unseen Messages */}
            {room.unseenMessagesCount > 0 && (
              <div className="absolute top-2 right-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              </div>
            )}
          </div>
        ))
      ) : (
        <p className="text-center text-gray-500 mt-4">No chat rooms found</p>
      )}
    </div>
  );
  
  const renderUsersList = () => {
    const availableUsers = getAvailableUsers();
    return (
      <div className="w-full max-w-md mt-4 mb-16">
        {availableUsers.length > 0 ? (
          availableUsers.map((user) => (
            <div
              key={user.id}
              className="flex items-center p-4 bg-white shadow-sm rounded-lg mb-2 hover:bg-gray-200 transition cursor-pointer border border-black"
              onClick={() => createNewChatRoom(user.id)}
            >
              <img
                src={user.avatar || '/default-avatar.png'}
                alt="Avatar"
                className="w-12 h-12 rounded-full mr-4 shadow-lg"
              />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-800">{user.fullName || 'Unknown User'}</h3>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500 mt-4">No available users</p>
        )}
      </div>
    );
  };

  return (
<div className="min-h-screen bg-gray-100 dark:bg-black flex flex-col items-center">
{/* <Header title="Chats" /> */}
      
      {/* Search Bar */}
      <div className="w-full px-4 py-2 bg-white dark:bg-gray-800 shadow-md rounded-lg mt-4 mb-2 border border-gray-300 dark:border-gray-600">
        <input
          type="text"
          className="w-full p-3 rounded-md text-lg placeholder-gray-400 border border-gray-300 focus:outline-none focus:ring focus:ring-blue-500 transition dark:bg-gray-800 dark:text-white dark:placeholder-gray-500 dark:border-gray-600 dark:focus:ring-blue-400"          placeholder="Search chats..."
          // placeholder="Search chats..."
          value={searchTerm}
          onChange={handleSearchChange}
        />
      </div>

      {/* Render Chats */}
      {!showUsersList && renderChats()}

      {/* Show Users List */}
      {showUsersList && renderUsersList()}
    </div>
  );
};

export default ChatListPage;
