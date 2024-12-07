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
  const [loading, setLoading] = useState(true);
  const [userNames, setUserNames] = useState({});
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const navigate = useNavigate();

  // Fetch current user data
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
      } else {
        setLoading(false);
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

          const names = await fetchUserNamesInBulk(allUserIds);
          setUserNames(names);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
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

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <aside
      className={`${isCollapsed ? 'w-20' : 'w-64'} fixed right-0 top-24 h-[calc(100vh-6rem)] bg-white text-gray-800 flex flex-col justify-between p-4 shadow-md border-l border-gray-200 transition-all duration-300`}
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
                {userNames[chat.otherUserId] || 'Loading...'}
              </span>
            </div>
          ))}
        </div>

        {/* Followers */}
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
                    {userNames[follower.id] || 'Loading...'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Following */}
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
                    {userNames[followed.id] || 'Loading...'}
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
