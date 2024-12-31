import React, { useEffect, useState } from 'react';
import { db, auth, storage } from './firebaseConfig';
import { addDoc , doc, getDoc, collection, getDocs, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { getDownloadURL, ref as storageRef } from "firebase/storage";
import { useParams, useNavigate } from 'react-router-dom';
import { arrayUnion, arrayRemove } from 'firebase/firestore';
import Avatar from '@mui/material/Avatar';
import Modal from '@mui/material/Modal';
import loaderGif from '../assets/normload.gif'; // Adjust path to loader asset
// import Notification from './Notifications';

const UserProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [userDetails, setUserDetails] = useState({
    displayName: '',
    avatar: '',
    username: '',
    bio: '',
    followers: [],
    following: [],
  });
  const [followersData, setFollowersData] = useState([]);
  const [followingData, setFollowingData] = useState([]);
  const [userPosts, setUserPosts] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentUserDetails, setCurrentUserDetails] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [isUserListModalOpen, setIsUserListModalOpen] = useState(false);
  const [listType, setListType] = useState(null); // 'followers' or 'following'
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Check system preference
    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDarkMode(prefersDarkMode);

    // Listener for theme change
    const handleThemeChange = (e) => {
      setIsDarkMode(e.matches);
    };

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', handleThemeChange);

    return () => {
      mediaQuery.removeEventListener('change', handleThemeChange);
    };
  }, []);

  useEffect(() => {
    // Fetch current user ID
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUserId(user.uid);
        fetchCurrentUserDetails(user.uid);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchCurrentUserDetails = async (userId) => {
    const userDoc = await getDoc(doc(db, 'users', userId));
    setCurrentUserDetails(userDoc.data());
  };

  useEffect(() => {
    const fetchUserData = async () => {
      if (userId) {
        const userRef = doc(db, 'users', userId);
        try {
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const userData = userSnap.data();
            let avatarUrl = '';
            if (userData.avatar) {
              const avatarRef = storageRef(storage, `avatars/${userId}`);
              avatarUrl = await getDownloadURL(avatarRef);
            }
            setUserDetails({
              displayName: userData.fullName || 'User Profile',
              avatar: avatarUrl,
              username: userData.username || '',
              bio: userData.bio || '',
              followers: userData.followers || [],
              following: userData.following || [],
            });
            setIsFollowing(userData.followers?.includes(currentUserId) || false);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchUserData();
  }, [userId, currentUserId]);

  useEffect(() => {
    const fetchUserPosts = async () => {
      if (userId) {
        try {
          const postsRef = collection(db, `users/${userId}/posts`);
          const querySnapshot = await getDocs(postsRef);
          const posts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          // Sort posts by timestamp in descending order
          posts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
          setUserPosts(posts);
        } catch (error) {
          console.error('Error fetching user posts:', error);
        }
      }
    };
    fetchUserPosts();
  }, [userId]);

  // Fetch followers and following data
  useEffect(() => {
    const fetchUserListDetails = async (list, setData) => {
      const users = await Promise.all(
        list.map(async (userId) => {
          if (typeof userId !== 'string') {
            console.error('Invalid userId:', userId);
            return null;
          }
          const userRef = doc(db, 'users', userId);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const userData = userSnap.data();
            let avatarUrl = '';
            if (userData.avatar) {
              const avatarRef = storageRef(storage, `avatars/${userId}`);
              avatarUrl = await getDownloadURL(avatarRef);
            }
            return {
              id: userId,
              fullName: userData.fullName || 'Unknown User',
              avatar: avatarUrl,
            };
          }
          return null;
        })
      );
      setData(users.filter(user => user !== null)); // Filter out any null values
    };

    if (userDetails.followers.length > 0) {
      fetchUserListDetails(userDetails.followers, setFollowersData);
    }
    if (userDetails.following.length > 0) {
      fetchUserListDetails(userDetails.following, setFollowingData);
    }
  }, [userDetails.followers, userDetails.following]);

  const handleFollowToggle = async () => {
    const currentUserRef = doc(db, 'users', currentUserId);
    const followedUserRef = doc(db, 'users', userId);
  
    try {
      if (isFollowing) {
        await updateDoc(currentUserRef, {
          following: arrayRemove(userId),
        });
        await updateDoc(followedUserRef, {
          followers: arrayRemove(currentUserId),
        });
      } else {
        await updateDoc(currentUserRef, {
          following: arrayUnion(userId),
        });
        await updateDoc(followedUserRef, {
          followers: arrayUnion(currentUserId),
        });
  
        // Add a notification to the followed user's notifications collection
        const notificationMessage = `${currentUserDetails.username} started following you.`;
        await addDoc(collection(db, `users/${userId}/notifications`), {
          type: 'follow',
          message: notificationMessage,
          timestamp: new Date().toISOString(),
          seen: false,
        });
      }
  
      setIsFollowing(!isFollowing);
    } catch (error) {
      console.error("Error toggling follow status: ", error);
    }
  };
  
  const shareProfile = () => {
    const profileLink = `https://hiihive.vercel.app/user/${userId}`;
    navigator.clipboard.writeText(profileLink);
    alert('Profile link copied to clipboard!');
  };

  const handlePostClick = (post) => {
    setSelectedPost(post);
    setIsPostModalOpen(true);
  };

  const handleUserListClick = (type) => {
    setListType(type);
    setIsUserListModalOpen(true);
  };

  const renderPostContent = (post) => {
    const { fileType, fileUrl, caption } = post;

    if (fileType?.includes('image')) {
      return <img src={fileUrl} alt={caption} className="w-full h-64 object-cover" />;
    }
    if (fileType?.includes('video')) {
      return <video controls src={fileUrl} className="w-full h-64 object-cover" />;
    }
    if (fileType?.includes('audio')) {
      return <audio controls src={fileUrl} className="w-full" />;
    }
    if (fileType === 'image/png') {
      return <img src={fileUrl} alt={caption} className="w-full h-64 object-cover" />;
    }
    return (
      <div className="flex items-center justify-center bg-gray-200 h-64 text-gray-700">
        <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="underline">
          Open File
        </a>
      </div>
    );
  };

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!userId) return;
      const notificationsRef = collection(db, 'users', userId, 'notifications');
      const notificationsSnapshot = await getDocs(notificationsRef);
      const notificationsList = notificationsSnapshot.docs.map(doc => doc.data());
      setNotifications(notificationsList);
    };

    fetchNotifications();
  }, [userId]);

  const handleFollow = async (followedUserId) => {
    if (!currentUserId) return;

    const userRef = doc(db, 'users', followedUserId);
    const currentUserRef = doc(db, 'users', currentUserId);

    await updateDoc(userRef, {
      followers: arrayUnion(currentUserId)
    });

    await updateDoc(currentUserRef, {
      following: arrayUnion(followedUserId)
    });

    // Add notification
    await addNotification(followedUserId, currentUserId);
  };

  const addNotification = async (followedUserId, followerId) => {
    const followerDoc = await getDoc(doc(db, 'users', followerId));
    const followerData = followerDoc.data();

    const notificationRef = collection(db, 'users', followedUserId, 'notifications');
    await addDoc(notificationRef, {
      type: 'follow',
      followerId: followerId,
      followerName: currentUserDetails.username, // Use current user's username
      followerAvatar: followerData.avatar,
      timestamp: new Date()
    });
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col justify-center items-center bg-gray-100">
        <img src={loaderGif} alt="Loading" className="w-32 h-32" />
      </div>
    );
  }

  return (
    <div className={`flex flex-col min-h-screen ${isDarkMode ? 'bg-black text-white' : 'bg-white text-gray-900'}`}>
      <div className="flex flex-col items-center text-center pb-6 mb-6 border-b border-gray-300">
        <Avatar
          src={userDetails.avatar || ''}
          alt="Profile"
          className="rounded-full border border-gray-300"
          style={{ width: '128px', height: '128px' }}
        />
        <h2 className="text-2xl font-semibold mt-4">{userDetails.username}</h2>
        <p>{userDetails.displayName}</p>
        <p className="text-sm mt-2">{userDetails.bio}</p>
        <div className="flex space-x-6 mt-4">
          <button
            className="text-sm font-semibold"
            onClick={() => handleUserListClick('followers')}
          >
            <span>{followersData.length || 0}</span> followers
          </button>
          <button
            className="text-sm font-semibold"
            onClick={() => handleUserListClick('following')}
          >
            <span>{followingData.length || 0}</span> following
          </button>
        </div>
        {userId !== currentUserId && (
          <button
            onClick={handleFollowToggle}
            className={`mt-4 px-6 py-2 text-sm font-semibold rounded-md ${
              isFollowing ? 'bg-gray-300 text-gray-700' : 'bg-blue-500 text-white'
            }`}
          >
            {isFollowing ? 'Following' : 'Follow'}
          </button>
        )}
        <button
          onClick={shareProfile}
          className="mt-4 px-6 py-2 text-sm font-semibold rounded-md bg-gradient-to-r from-blue-500 to-indigo-500 text-white"
        >
          Share Profile
        </button>
      </div>
      {/* Posts Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 p-4">
        {userPosts.map(post => (
          <div
            key={post.id}
            className="relative group overflow-hidden rounded-lg shadow-lg cursor-pointer"
            onClick={() => handlePostClick(post)}
          >
            {renderPostContent(post)}
          </div>
        ))}
      </div>
      {/* Followers/Following Modal */}
      <Modal open={isUserListModalOpen} onClose={() => setIsUserListModalOpen(false)}>
        <div className={`bg-white max-w-md mx-auto mt-20 p-6 rounded-lg shadow-lg ${isDarkMode ? 'bg-black text-white' : 'bg-white text-gray-900'}`}>
          <h3 className="text-lg font-semibold">
            {listType === 'followers' ? 'Followers' : 'Following'}
          </h3>
          <ul className="mt-4 space-y-2">
            {(listType === 'followers' ? followersData : followingData).map((user, index) => (
              <li key={index} className="flex items-center space-x-4">
                <Avatar src={user.avatar || ''} alt={user.fullName} />
                <p className={`text-gray-700 ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>{user.fullName || 'Anonymous User'}</p>
              </li>
            ))}
          </ul>
        </div>
        </Modal>
    </div>
  );
};

export default UserProfile;
