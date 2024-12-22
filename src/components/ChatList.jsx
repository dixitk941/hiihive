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
  const [communities, setCommunities] = useState([]);
  const [users, setUsers] = useState([]); // List of all users for creating a new chat
  const [filteredChatRooms, setFilteredChatRooms] = useState([]);
  const [filteredCommunities, setFilteredCommunities] = useState([]);
  const [activeTab, setActiveTab] = useState('chats'); // State to track active tab
  const [showUsersList, setShowUsersList] = useState(false); // Show/hide users list
  const [selectedUser, setSelectedUser] = useState(null); // Track selected user for new chat
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

    // Fetch communities from Firestore
    const communityQuery = collection(db, 'communities');
    const unsubscribeCommunities = onSnapshot(communityQuery, (snapshot) => {
      const communityList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setCommunities(communityList);
      setFilteredCommunities(communityList); // Initially set filtered communities to all
    });

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
        return {
          id: doc.id,
          otherUser,
          otherUserFullName: otherUserDetails?.fullName || 'Unknown User',
          otherUserAvatar: otherUserDetails?.avatar || '/default-avatar.png',
          ...data,
        };
      }));
      setChatRooms(rooms.filter(Boolean));
      setFilteredChatRooms(rooms.filter(Boolean)); // Initially set filtered chat rooms to all
    });

    // Fetch all users (for new chat)
    const userQuery = collection(db, 'users');
    const unsubscribeUsers = onSnapshot(userQuery, (snapshot) => {
      const usersList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setUsers(usersList);
    });

    return () => {
      unsubscribeCommunities();
      unsubscribeChatRooms();
      unsubscribeUsers();
    };
  }, [currentUser]);

  // Filter chat rooms and communities based on search term
  const handleSearchChange = (event) => {
    const value = event.target.value;
    startTransition(() => {
      setSearchTerm(value);
      filterChatRoomsAndCommunities(value);
    });
  };

  const filterChatRoomsAndCommunities = (term) => {
    // Filter chat rooms
    const filteredRooms = chatRooms.filter((room) =>
      room.otherUserFullName.toLowerCase().includes(term.toLowerCase())
    );
    setFilteredChatRooms(filteredRooms);

    // Filter communities
    const filteredComms = communities.filter((community) =>
      community.name.toLowerCase().includes(term.toLowerCase())
    );
    setFilteredCommunities(filteredComms);
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
            className="flex items-center p-4 bg-white shadow-sm rounded-lg mb-2 hover:bg-gray-200 transition cursor-pointer border border-black"
            onClick={() => handleChatRoomClick(room.id)}
          >
            <img
              src={room.otherUserAvatar || '/default-avatar.png'}
              alt="Avatar"
              className="w-12 h-12 rounded-full mr-4 shadow-lg"
            />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-800">{room.otherUserFullName || 'Unknown User'}</h3>
              <p className="text-sm text-gray-500 truncate">
                {room.lastMessage || 'No messages yet'}
              </p>
            </div>
          </div>
        ))
      ) : (
        <p className="text-center text-gray-500 mt-4">No chat rooms found</p>
      )}
    </div>
  );

  const renderCommunities = () => (
    <div className="w-full max-w-md mt-4 mb-16">
      {filteredCommunities.length > 0 ? (
        filteredCommunities.map((community) => (
          <div
            key={community.id}
            className="flex items-center p-4 bg-white shadow-sm rounded-lg mb-2 hover:bg-gray-200 transition cursor-pointer border border-black"
          >
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-800">{community.name}</h3>
            </div>
          </div>
        ))
      ) : (
        <p className="text-center text-gray-500 mt-4">No communities found</p>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center">
      <Header title="Chats" />
      {/* Search Bar */}
      <div className="w-full px-4 py-2 bg-white shadow-md rounded-lg mt-4 mb-2 border border-gray-300">
        <input
          type="text"
          className="w-full p-3 rounded-md text-lg placeholder-gray-400 border border-gray-300 focus:outline-none focus:ring focus:ring-blue-500 transition"
          placeholder="Search chats and communities..."
          value={searchTerm}
          onChange={handleSearchChange}
        />
      </div>

      {/* Tabs - Chats and Communities */}
      <div className="w-full flex justify-between bg-white shadow-md rounded-lg border border-gray-300 mb-4">
        <button
          className={`p-3 w-1/2 text-lg text-center ${activeTab === 'chats' ? 'bg-indigo-600 text-white rounded-l-lg' : 'bg-transparent text-gray-600 hover:bg-indigo-100'}`}
          onClick={() => setActiveTab('chats')}
        >
          Chats
        </button>
        <button
          className={`p-3 w-1/2 text-lg text-center ${activeTab === 'communities' ? 'bg-indigo-600 text-white rounded-r-lg' : 'bg-transparent text-gray-600 hover:bg-indigo-100'}`}
          onClick={() => setActiveTab('communities')}
        >
          Communities
        </button>
      </div>

      {/* Floating New Chat Button */}
      <button
        onClick={() => setShowUsersList((prev) => !prev)} // Toggle the visibility of the user list
        className="fixed bottom-20 right-8 p-4 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition z-50"
      >
        <FontAwesomeIcon icon={faPlus} size="lg" />
      </button>

      {/* Show users list for new chat */}
      {showUsersList && (
        <div className="w-full max-w-md mt-4 bg-white p-4 rounded-lg shadow-md mb-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Select a User to Chat</h3>
          {getAvailableUsers().map((user) => (
            <div
              key={user.id}
              className="flex items-center p-4 bg-white shadow-sm rounded-lg mb-2 hover:bg-gray-200 cursor-pointer"
              onClick={() => createNewChatRoom(user.id)}
            >
              <img
                src={user.avatar || '/default-avatar.png'}
                alt="Avatar"
                className="w-12 h-12 rounded-full mr-4 shadow-lg"
              />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-800">{user.username}</h3>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Display chats or communities based on active tab */}
      {activeTab === 'chats' ? renderChats() : renderCommunities()}
    </div>
  );
};

export default ChatListPage;
