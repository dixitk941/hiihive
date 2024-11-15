import React, { useState, useEffect } from 'react';
import { FiMessageSquare } from 'react-icons/fi';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getDatabase, ref, set } from 'firebase/database';

const ChatList = ({ setSelectedChat }) => {
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userNames, setUserNames] = useState({});

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
          setFollowers(fetchedFollowers);
          setFollowing(fetchedFollowing);

          const allUserIds = [...fetchedFollowers.map(f => f.id), ...fetchedFollowing.map(f => f.id)];
          const names = await fetchUserNamesInBulk(allUserIds);
          setUserNames(names);
        }
      } catch (error) {
        // console.error('Error fetching user data:', error);
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
    const userFetchPromises = userIds.map((userId) =>
      getDoc(doc(db, 'users', userId)).then((userDoc) => {
        if (userDoc.exists()) {
          names[userId] = userDoc.data().fullName || 'Unknown';
        } else {
          names[userId] = 'Unknown';
        }
      }).catch((error) => {
        // console.error(`Error fetching name for ${userId}:`, error);
        names[userId] = 'Error';
      })
    );

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

    // No need to redirect here, as the parent component will handle the rendering of ChatInterface
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-4 bg-gray-50 h-screen overflow-y-auto">
      <h2 className="text-xl font-semibold mb-4">Chat List</h2>
      <div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Followers</h3>
        {followers.length === 0 ? (
          <p className="text-gray-500">No followers yet</p>
        ) : (
          followers.map((follower) => (
            <div
              key={follower.id}
              onClick={() => handleChatSelection(follower.id)}
              className="flex items-center p-3 bg-white rounded-lg hover:bg-blue-50 transition duration-300 mb-2"
            >
              <FiMessageSquare className="text-blue-500" size={20} />
              <span className="ml-3 font-semibold">
                Chat with {userNames[follower.id] || 'Loading...'}
              </span>
            </div>
          ))
        )}
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2 mt-6">Following</h3>
        {following.length === 0 ? (
          <p className="text-gray-500">You're not following anyone</p>
        ) : (
          following.map((followed) => (
            <div
              key={followed.id}
              onClick={() => handleChatSelection(followed.id)}
              className="flex items-center p-3 bg-white rounded-lg hover:bg-blue-50 transition duration-300 mb-2"
            >
              <FiMessageSquare className="text-blue-500" size={20} />
              <span className="ml-3 font-semibold">
                Chat with {userNames[followed.id] || 'Loading...'}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ChatList;
