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
    // Fetch current user first
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // If user is logged in, set the currentUser state
        setCurrentUser(user);
      } else {
        // If no user is logged in, you can redirect to login or handle accordingly
        setLoading(false);
        // console.log('No user logged in');
      }
    });

    // Clean up the auth state listener
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Fetch followers and following if currentUser is available
    const fetchUserData = async () => {
      if (!currentUser) {
        return; // Prevent fetching if currentUser is not available
      }

      try {
        // console.log('Fetching user data for:', currentUser?.uid);

        const userRef = doc(db, 'users', currentUser.uid); // Use uid from currentUser
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          
          // Check if followers and following are defined, otherwise use empty array
          const fetchedFollowers = userData.followers || [];
          const fetchedFollowing = userData.following || [];

          setFollowers(fetchedFollowers);
          setFollowing(fetchedFollowing);
          // console.log('User data fetched:', userData);

          // Fetch names of followers and following in bulk
          const allUserIds = [...fetchedFollowers.map(f => f.id), ...fetchedFollowing.map(f => f.id)]; // Combine the userIds
          // console.log('User IDs to fetch names for:', allUserIds); // Debugging line
          const names = await fetchUserNamesInBulk(allUserIds);
          // console.log('Fetched names:', names); // Debugging line
          setUserNames(names);
        } else {
          // console.log('User not found');
        }
      } catch (error) {
        // console.error('Error fetching user data:', error);
      } finally {
        setLoading(false); // Set loading to false once data is fetched
      }
    };

    // Only fetch data when currentUser is available
    if (currentUser) {
      fetchUserData();
    }
  }, [currentUser]);

  // Function to fetch user names in bulk for a list of user IDs
  const fetchUserNamesInBulk = async (userIds) => {
    const names = {};

    // Create an array of promises for fetching user names
    const userFetchPromises = userIds.map((userId) => {
      return getDoc(doc(db, 'users', userId)).then((userDoc) => {
        if (userDoc.exists()) {
          names[userId] = userDoc.data().fullName || 'Unknown'; // Store fullName or 'Unknown'
        } else {
          names[userId] = 'Unknown'; // Default to 'Unknown' if user doesn't exist
        }
      }).catch((error) => {
        // console.error(`Error fetching name for ${userId}:`, error);
        names[userId] = 'Error'; // Handle errors gracefully
      });
    });

    // Wait for all promises to resolve
    await Promise.all(userFetchPromises);

    return names;
  };

  const handleChatSelection = async (chatId) => {
    setSelectedChat(chatId); // Set the selected chat when a chat item is clicked

    const db = getDatabase();
    const currentUserId = currentUser.uid;

    // Create a unique chat room ID
    const chatRoomId = [currentUserId, chatId].sort().join('_');

    // Add the chat room to the real-time database
    await set(ref(db, `chatRooms/${chatRoomId}`), {
      users: {
        [currentUserId]: true,
        [chatId]: true,
      },
      createdAt: new Date().toISOString(),
    });

    // Redirect to the chat interface (assuming you have a route for it)
    window.location.href = `/chat/${chatRoomId}`;
  };

  if (loading) {
    return <div>Loading...</div>; // Display loading state while fetching data
  }

  return (
    <aside
      className={`${isCollapsed ? 'w-20' : 'w-64'} fixed right-0 top-24 h-[calc(100vh-6rem)] bg-white text-gray-800 flex flex-col justify-between p-4 shadow-md border-l border-gray-200 transition-all duration-300`}
    >
      <div>
        {/* Collapse/Expand Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-gray-500 hover:text-blue-600 transition-colors duration-300 mb-4"
        >
          {isCollapsed ? <FiChevronRight size={24} /> : <FiChevronLeft size={24} />}
        </button>

        <h2 className={`${isCollapsed ? 'hidden' : 'text-xl font-bold mb-6 text-gray-700'}`}>Chats</h2>

        {/* Followers Section */}
        <div>
          <h3 className={`${isCollapsed ? 'hidden' : 'text-lg font-semibold text-gray-700 mb-3'}`}>Followers</h3>
          {followers.length === 0 ? (
            <p className="text-gray-500">No followers yet</p>
          ) : (
            followers.map((follower) => (
              <div
                key={follower.id}
                onClick={() => handleChatSelection(follower.id)}
                className={`flex items-center p-3 bg-gray-100 rounded-lg hover:bg-blue-50 transition duration-300 ${isCollapsed ? 'justify-center' : ''}`}
              >
                <FiMessageSquare className="text-blue-500" size={20} />
                <span className={`${isCollapsed ? 'hidden' : 'ml-3 font-semibold'}`}>
                  Chat with {userNames[follower.id] || 'Loading...'} {/* Show name or loading if not available */}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Following Section */}
        <div>
          <h3 className={`${isCollapsed ? 'hidden' : 'text-lg font-semibold text-gray-700 mb-3 mt-6'}`}>Following</h3>
          {following.length === 0 ? (
            <p className="text-gray-500">You're not following anyone</p>
          ) : (
            following.map((followed) => (
              <div
                key={followed.id}
                onClick={() => handleChatSelection(followed.id)}
                className={`flex items-center p-3 bg-gray-100 rounded-lg hover:bg-blue-50 transition duration-300 ${isCollapsed ? 'justify-center' : ''}`}
              >
                <FiMessageSquare className="text-blue-500" size={20} />
                <span className={`${isCollapsed ? 'hidden' : 'ml-3 font-semibold'}`}>
                  Chat with {userNames[followed.id] || 'Loading...'} {/* Show name or loading if not available */}
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