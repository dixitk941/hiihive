import React, { useState, useEffect } from 'react';
import { FiMessageSquare, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebaseConfig'; // Import your Firebase config
import { getAuth, onAuthStateChanged } from 'firebase/auth'; // Firebase Auth for currentUser
import { getDatabase, ref, set } from 'firebase/database'; // Import Firebase Realtime Database functions

const SidebarRight = ({ setSelectedChat }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [currentUser, setCurrentUser] = useState(null); // State for the current user
  const [loading, setLoading] = useState(true); // Track loading state
  const [userNames, setUserNames] = useState({}); // State to store user names

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

          // Ensure followers are objects with id properties
          const formattedFollowers = fetchedFollowers.map(f => typeof f === 'string' ? { id: f } : f);

          setFollowers(formattedFollowers);
          setFollowing(fetchedFollowing);

          const allUserIds = [...formattedFollowers.map(f => f.id), ...fetchedFollowing.map(f => f.id)].filter(Boolean);
          console.log('All user IDs:', allUserIds); // Log all user IDs
          const names = await fetchUserNamesInBulk(allUserIds);
          setUserNames(names);

          console.log('Fetched followers:', formattedFollowers);
          console.log('Fetched following:', fetchedFollowing);
          console.log('Fetched user names:', names);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchUserData();
    }
  }, [currentUser]);

  const fetchUserNamesInBulk = async (userIds) => {
    const names = {};

    const userFetchPromises = userIds.map((userId) => {
      if (!userId) {
        console.error('Invalid user ID:', userId); // Log invalid user ID
        return Promise.resolve();
      }

      return getDoc(doc(db, 'users', userId)).then((userDoc) => {
        if (userDoc.exists()) {
          names[userId] = userDoc.data().fullName || 'Unknown';
        } else {
          names[userId] = 'Unknown';
        }
      }).catch((error) => {
        console.error(`Error fetching name for ${userId}:`, error);
        names[userId] = 'Error';
      });
    });

    await Promise.all(userFetchPromises);

    return names;
  };

  const handleChatSelection = async (chatId) => {
    setSelectedChat(chatId);

    const db = getDatabase();
    const currentUserId = currentUser.uid;

    const chatRoomId = [currentUserId, chatId].sort().join('_');

    await set(ref(db, `chatRooms/${chatRoomId}`), {
      users: {
        [currentUserId]: true,
        [chatId]: true,
      },
      createdAt: new Date().toISOString(),
    });

    window.location.href = `/chat/${chatRoomId}`;
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <aside className={`${isCollapsed ? 'w-20' : 'w-64'} fixed right-0 top-24 h-[calc(100vh-6rem)] bg-white text-gray-800 flex flex-col justify-between p-4 shadow-md border-l border-gray-200 transition-all duration-300`}>
      <div>
        <button onClick={() => setIsCollapsed(!isCollapsed)} className="text-gray-500 hover:text-blue-600 transition-colors duration-300 mb-4">
          {isCollapsed ? <FiChevronRight size={24} /> : <FiChevronLeft size={24} />}
        </button>

        <h2 className={`${isCollapsed ? 'hidden' : 'text-xl font-bold mb-6 text-gray-700'}`}>Chats</h2>

        <div>
          <h3 className={`${isCollapsed ? 'hidden' : 'text-lg font-semibold text-gray-700 mb-3'}`}>Followers</h3>
          {followers.length === 0 ? (
            <p className="text-gray-500">No followers yet</p>
          ) : (
            followers.map((follower) => (
              <div key={follower.id} onClick={() => handleChatSelection(follower.id)} className={`flex items-center p-3 bg-gray-100 rounded-lg hover:bg-blue-50 transition duration-300 ${isCollapsed ? 'justify-center' : ''}`}>
                <FiMessageSquare className="text-blue-500" size={20} />
                <span className={`${isCollapsed ? 'hidden' : 'ml-3 font-semibold'}`}>
                  Chat with {userNames[follower.id] || 'Loading...'}
                </span>
              </div>
            ))
          )}
        </div>

        <div>
          <h3 className={`${isCollapsed ? 'hidden' : 'text-lg font-semibold text-gray-700 mb-3 mt-6'}`}>Following</h3>
          {following.length === 0 ? (
            <p className="text-gray-500">You're not following anyone</p>
          ) : (
            following.map((followed) => (
              <div key={followed.id} onClick={() => handleChatSelection(followed.id)} className={`flex items-center p-3 bg-gray-100 rounded-lg hover:bg-blue-50 transition duration-300 ${isCollapsed ? 'justify-center' : ''}`}>
                <FiMessageSquare className="text-blue-500" size={20} />
                <span className={`${isCollapsed ? 'hidden' : 'ml-3 font-semibold'}`}>
                  Chat with {userNames[followed.id] || 'Loading...'}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </aside>
  );
};

export default SidebarRight;