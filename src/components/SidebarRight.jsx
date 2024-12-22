import React, { useState, useEffect } from 'react';
import { FiChevronLeft, FiChevronRight, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebaseConfig'; // Import Firebase config
import { getAuth, onAuthStateChanged } from 'firebase/auth'; // Firebase Auth
import { useNavigate } from 'react-router-dom';

const SidebarRight = ({ isCollapsed, setIsCollapsed }) => {
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [userDetails, setUserDetails] = useState({}); // Stores fullName and avatar for each user
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const navigate = useNavigate();

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

  // Fetch followers and following, then fetch their details
  useEffect(() => {
    const fetchUserData = async () => {
      if (!currentUser) return;

      try {
        const userRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          // Ensure followers and following are arrays of user IDs
          const fetchedFollowers = Array.isArray(userData.followers) ? userData.followers : [];
          const fetchedFollowing = Array.isArray(userData.following) ? userData.following : [];

          // Set followers and following IDs (both are arrays)
          setFollowers(fetchedFollowers);
          setFollowing(fetchedFollowing);

          // Fetch details (fullName and avatar) for all followers and following users in one go
          const allUserIds = [
            ...fetchedFollowers,
            ...fetchedFollowing, // Following is now just an array of user IDs
          ].filter(Boolean);

          // Fetch details for all user IDs
          const details = await fetchUserDetailsInBulk(allUserIds);
          setUserDetails(details);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, [currentUser]);

  // Fetch user details (fullName and avatar) for each user ID
  const fetchUserDetailsInBulk = async (userIds) => {
    const details = {};
    const userFetchPromises = userIds.map((userId) => {
      return getDoc(doc(db, 'users', userId))
        .then((userDoc) => {
          if (userDoc.exists()) {
            const userData = userDoc.data();
            details[userId] = {
              fullName: userData.fullName || 'Unknown',
              avatar: userData.avatar || 'default-avatar-url', // Use a default avatar URL if none exists
            };
          } else {
            details[userId] = { fullName: 'Unknown', avatar: 'default-avatar-url' };
          }
        })
        .catch((error) => {
          console.error(`Error fetching details for ${userId}:`, error);
          details[userId] = { fullName: 'Error', avatar: 'default-avatar-url' };
        });
    });

    // Wait for all the user details to be fetched
    await Promise.all(userFetchPromises);
    return details;
  };

  // Handle follower click (navigate to user profile)
  const handleFollowerClick = (userId) => {
    navigate(`/profile/${userId}`);
  };

  // Handle following click (navigate to user profile)
  const handleFollowingClick = (userId) => {
    navigate(`/user/${userId}`);
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

        <h2 className={`${isCollapsed ? 'hidden' : 'text-xl font-bold mb-6 text-gray-700'}`}>Users</h2>

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
              {followers.map((followerId) => (
                <div
                  key={followerId}
                  onClick={() => handleFollowerClick(followerId)}
                  className={`flex items-center p-3 mb-2 bg-gray-100 rounded-lg hover:bg-blue-50 transition duration-300 ${
                    isCollapsed ? 'justify-center' : ''
                  }`}
                >
                  {/* Display avatar */}
                  <img
                    src={userDetails[followerId]?.avatar || 'default-avatar-url'}
                    alt={userDetails[followerId]?.fullName}
                    className="w-8 h-8 rounded-full"
                  />
                  <span className={`${isCollapsed ? 'hidden' : 'ml-3 font-semibold'}`}>
                    {userDetails[followerId]?.fullName || 'Unknown'}
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
              {following.map((followedUserId) => (
                <div
                  key={followedUserId}
                  onClick={() => handleFollowingClick(followedUserId)}
                  className={`flex items-center p-3 mb-2 bg-gray-100 rounded-lg hover:bg-blue-50 transition duration-300 ${
                    isCollapsed ? 'justify-center' : ''
                  }`}
                >
                  {/* Display avatar */}
                  <img
                    src={userDetails[followedUserId]?.avatar || 'default-avatar-url'}
                    alt={userDetails[followedUserId]?.fullName}
                    className="w-8 h-8 rounded-full"
                  />
                  <span className={`${isCollapsed ? 'hidden' : 'ml-3 font-semibold'}`}>
                    {userDetails[followedUserId]?.fullName || 'Unknown'}
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
