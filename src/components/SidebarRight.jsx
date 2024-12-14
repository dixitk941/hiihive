import React, { useState, useEffect } from 'react';
import { FiMessageSquare, FiChevronLeft, FiChevronRight, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebaseConfig'; // Import Firebase config
import { getAuth, onAuthStateChanged } from 'firebase/auth'; // Firebase Auth
import { useNavigate } from 'react-router-dom';

const SidebarRight = ({ setSelectedChat }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [recentChats, setRecentChats] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [userNames, setUserNames] = useState({});
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const navigate = useNavigate();

  // Hardcode the communities
  const hardcodedCommunities = [
    { name: 'RATM-BCA' },
    { name: 'RATM-BBA' }
  ];

  // Fetch current user data
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch user details
  useEffect(() => {
    const fetchUserData = async () => {
      if (!currentUser) return;

      try {
        const userRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          const fetchedFollowers = userData.followers || [];
          const fetchedFollowing = userData.following || [];

          setFollowers(fetchedFollowers.map(f => (typeof f === 'string' ? { id: f } : f)));
          setFollowing(fetchedFollowing);

          const recentChatRoomsQuery = query(
            collection(db, 'chatRooms'),
            where('users', 'array-contains', currentUser.uid)
          );
          const recentChatRoomsSnapshot = await getDocs(recentChatRoomsQuery);

          const fetchedRecentChats = [];
          recentChatRoomsSnapshot.forEach((doc) => {
            const chatRoomData = doc.data();
            if (chatRoomData.users) {
              const otherUserId = chatRoomData.users.find(userId => userId !== currentUser.uid);
              if (otherUserId) {
                fetchedRecentChats.push({
                  id: doc.id,
                  otherUserId: otherUserId,
                });
              }
            }
          });

          setRecentChats(fetchedRecentChats);

          const allUserIds = [
            ...fetchedFollowers.map(f => f.id),
            ...fetchedFollowing.map(f => f.id),
            ...fetchedRecentChats.map(c => c.otherUserId),
          ].filter(Boolean);

          // Fetch names for all users in one go
          const names = await fetchUserNamesInBulk(allUserIds);
          setUserNames(names);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, [currentUser]);

  // Fetch usernames in bulk
  const fetchUserNamesInBulk = async (userIds) => {
    const names = {};
    const userFetchPromises = userIds.map((userId) => {
      return getDoc(doc(db, 'users', userId))
        .then((userDoc) => {
          if (userDoc.exists()) {
            names[userId] = userDoc.data().fullName || 'Unknown';
          } else {
            names[userId] = 'Unknown';
          }
        })
        .catch((error) => {
          console.error(`Error fetching name for ${userId}:`, error);
          names[userId] = 'Error';
        });
    });
    await Promise.all(userFetchPromises);
    return names;
  };

  // Function to create a community chatroom
  const createCommunityChatRoom = async (communityName) => {
    if (!currentUser) return;

    // Create a unique chatroom ID based on the community name
    const chatRoomRef = doc(db, 'chatRooms', communityName);
    const chatRoomDoc = await getDoc(chatRoomRef);

    if (!chatRoomDoc.exists()) {
      // Create a new chatroom in Firestore
      await setDoc(chatRoomRef, {
        name: communityName,
        users: [currentUser.uid], // Initially add the current user
        createdAt: new Date().toISOString(),
        isOpen: true, // Open for all users
        messages: [],
      });
    }

    // Navigate to the community chat interface
    navigate(`/chat/${communityName}`);
  };

  // Handle community selection (e.g., RATM-BCA or RATM-BBA)
  const handleCommunitySelection = (communityName) => {
    createCommunityChatRoom(communityName);
  };

  // Reusable function to create or retrieve a chat room
  const createOrRetrieveChatRoom = async (selectedUserId) => {
    if (!currentUser) return;

    const chatRoomId = [currentUser.uid, selectedUserId].sort().join('_');
    const chatRoomRef = doc(db, 'chatRooms', chatRoomId);
    const chatRoomDoc = await getDoc(chatRoomRef);

    if (!chatRoomDoc.exists()) {
      await setDoc(chatRoomRef, {
        users: [currentUser.uid, selectedUserId],
        createdAt: new Date().toISOString(),
        lastMessage: null,
        messages: [],
      });
    }

    navigate(`/chat/${chatRoomId}`);
  };

  const handleChatSelection = (userId) => {
    createOrRetrieveChatRoom(userId);
  };

  return (
    <aside
      className={`${isCollapsed ? 'w-20' : 'w-64'} fixed right-0 top-24 h-[calc(100vh-6rem)] bg-white text-gray-800 flex flex-col justify-between p-4 shadow-md border-l border-gray-200 transition-all duration-300 overflow-y-auto`}
    >
      <div>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-gray-500 hover:text-blue-600 transition-colors duration-300 mb-4"
        >
          {isCollapsed ? <FiChevronRight size={24} /> : <FiChevronLeft size={24} />}
        </button>

        <h2 className={`${isCollapsed ? 'hidden' : 'text-xl font-bold mb-6 text-gray-700'}`}>Chats</h2>

        {/* Recent Chats */}
        <div>
          <h3 className={`${isCollapsed ? 'hidden' : 'text-lg font-semibold text-gray-700 mb-3'}`}>Recent Chats</h3>
          <div className="max-h-64 overflow-y-auto">
            {recentChats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => handleChatSelection(chat.otherUserId)}
                className={`flex items-center p-3 mb-2 bg-gray-100 rounded-lg hover:bg-blue-50 transition duration-300 ${
                  isCollapsed ? 'justify-center' : ''
                }`}
              >
                <FiMessageSquare className="text-blue-500" size={20} />
                <span className={`${isCollapsed ? 'hidden' : 'ml-3 font-semibold'}`}>
                  {userNames[chat.otherUserId] || 'Unknown'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Hardcoded Communities */}
        <div>
          <h3 className={`${isCollapsed ? 'hidden' : 'text-lg font-semibold text-gray-700 mb-3'}`}>Communities</h3>
          {hardcodedCommunities.map((community, index) => (
            <div
              key={index}
              onClick={() => handleCommunitySelection(community.name)}
              className={`flex items-center p-3 mb-2 bg-gray-100 rounded-lg hover:bg-blue-50 transition duration-300 ${isCollapsed ? 'justify-center' : ''}`}
            >
              <FiMessageSquare className="text-blue-500" size={20} />
              <span className={`${isCollapsed ? 'hidden' : 'ml-3 font-semibold'}`}>{community.name}</span>
            </div>
          ))}
        </div>

        {/* Followers Section */}
        <div>
          <h3 className={`${isCollapsed ? 'hidden' : 'text-lg font-semibold text-gray-700 mb-3 mt-6'}`}>
            Followers
            <button
              onClick={() => setShowFollowers(!showFollowers)}
              className="ml-2 text-gray-500 hover:text-blue-600 transition-colors duration-300"
            >
              {showFollowers ? <FiChevronUp size={20} /> : <FiChevronDown size={20} />}
            </button>
          </h3>
          {showFollowers && (
            <div className="max-h-64 overflow-y-auto">
              {followers.map((follower) => (
                <div
                  key={follower.id}
                  onClick={() => handleChatSelection(follower.id)}
                  className={`flex items-center p-3 mb-2 bg-gray-100 rounded-lg hover:bg-blue-50 transition duration-300 ${
                    isCollapsed ? 'justify-center' : ''
                  }`}
                >
                  <FiMessageSquare className="text-blue-500" size={20} />
                  <span className={`${isCollapsed ? 'hidden' : 'ml-3 font-semibold'}`}>
                    {userNames[follower.id] || 'Unknown'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Following Section */}
        <div>
          <h3 className={`${isCollapsed ? 'hidden' : 'text-lg font-semibold text-gray-700 mb-3 mt-6'}`}>
            Following
            <button
              onClick={() => setShowFollowing(!showFollowing)}
              className="ml-2 text-gray-500 hover:text-blue-600 transition-colors duration-300"
            >
              {showFollowing ? <FiChevronUp size={20} /> : <FiChevronDown size={20} />}
            </button>
          </h3>
          {showFollowing && (
            <div className="max-h-64 overflow-y-auto">
              {following.map((followed) => (
                <div
                  key={followed.id}
                  onClick={() => handleChatSelection(followed.id)}
                  className={`flex items-center p-3 mb-2 bg-gray-100 rounded-lg hover:bg-blue-50 transition duration-300 ${
                    isCollapsed ? 'justify-center' : ''
                  }`}
                >
                  <FiMessageSquare className="text-blue-500" size={20} />
                  <span className={`${isCollapsed ? 'hidden' : 'ml-3 font-semibold'}`}>
                    {userNames[followed.id] || 'Unknown'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default SidebarRight;
