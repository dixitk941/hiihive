import React, { useEffect, useState } from 'react';
import { db, auth, storage } from './firebaseConfig';
import { addDoc , doc, getDoc, collection, getDocs, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { getDownloadURL, ref as storageRef } from "firebase/storage";
import { useParams, useNavigate } from 'react-router-dom';
import { arrayUnion, arrayRemove } from 'firebase/firestore';
import Avatar from '@mui/material/Avatar';
import Modal from '@mui/material/Modal';
import loaderGif from '../assets/normload.gif';

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
  const [listType, setListType] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDarkMode(prefersDarkMode);

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
          posts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
          setUserPosts(posts);
        } catch (error) {
          console.error('Error fetching user posts:', error);
        }
      }
    };
    fetchUserPosts();
  }, [userId]);

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
      setData(users.filter(user => user !== null));
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
      return <img src={fileUrl} alt={caption} className="w-full h-full object-cover rounded-2xl" />;
    }
    if (fileType?.includes('video')) {
      return <video controls src={fileUrl} className="w-full h-full object-cover rounded-2xl" />;
    }
    if (fileType?.includes('audio')) {
      return <audio controls src={fileUrl} className="w-full rounded-2xl" />;
    }
    if (fileType === 'image/png') {
      return <img src={fileUrl} alt={caption} className="w-full h-full object-cover rounded-2xl" />;
    }
    return (
      <div className={`flex items-center justify-center h-full rounded-2xl ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
        <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 font-medium">
          Open File
        </a>
      </div>
    );
  };

  const renderFullPostContent = (post) => {
    const { fileType, fileUrl, caption } = post;

    if (fileType?.includes('image')) {
      return <img src={fileUrl} alt={caption} className="w-full max-h-96 object-contain rounded-2xl" />;
    }
    if (fileType?.includes('video')) {
      return (
        <video 
          controls 
          src={fileUrl} 
          className="w-full max-h-96 rounded-2xl"
          style={{ maxWidth: '100%' }}
        />
      );
    }
    if (fileType?.includes('audio')) {
      return (
        <div className={`p-6 rounded-2xl ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
          <audio controls src={fileUrl} className="w-full" />
        </div>
      );
    }
    if (fileType === 'image/png') {
      return <img src={fileUrl} alt={caption} className="w-full max-h-96 object-contain rounded-2xl" />;
    }
    return (
      <div className={`flex items-center justify-center p-8 rounded-2xl ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
        <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 font-medium">
          Open File
        </a>
      </div>
    );
  };

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

    await addNotification(followedUserId, currentUserId);
  };

  const addNotification = async (followedUserId, followerId) => {
    const followerDoc = await getDoc(doc(db, 'users', followerId));
    const followerData = followerDoc.data();

    const notificationRef = collection(db, 'users', followedUserId, 'notifications');
    await addDoc(notificationRef, {
      type: 'follow',
      followerId: followerId,
      followerName: currentUserDetails.username,
      followerAvatar: followerData.avatar,
      timestamp: new Date()
    });
  };

  if (loading) {
    return (
      <div className={`h-screen flex flex-col justify-center items-center ${isDarkMode ? 'bg-black' : 'bg-gray-50'}`}>
        <img src={loaderGif} alt="Loading" className="w-16 h-16 opacity-60" />
        <p className={`mt-4 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Header Section with One UI 7 Style */}
      <div className={`relative overflow-hidden ${isDarkMode ? 'bg-gradient-to-b from-gray-900 to-black' : 'bg-gradient-to-b from-blue-50 to-white'}`}>
        {/* Hero Background */}
        <div className="absolute inset-0 opacity-20">
          <div className={`w-full h-full ${isDarkMode ? 'bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900' : 'bg-gradient-to-br from-blue-100 via-indigo-50 to-purple-100'}`}></div>
        </div>
        
        {/* Profile Content */}
        <div className="relative z-10 pt-16 pb-8 px-6">
          <div className="max-w-md mx-auto text-center">
            {/* Avatar with One UI 7 glow effect */}
            <div className="relative mb-6">
              <div className={`absolute inset-0 rounded-full blur-xl opacity-30 ${isDarkMode ? 'bg-blue-400' : 'bg-blue-300'}`} style={{ width: '140px', height: '140px', margin: 'auto' }}></div>
              <Avatar
                src={userDetails.avatar || ''}
                alt="Profile"
                className={`relative mx-auto border-4 ${isDarkMode ? 'border-gray-700' : 'border-white'} shadow-2xl`}
                style={{ width: '120px', height: '120px' }}
              />
            </div>
            
            {/* User Info */}
            <div className="space-y-2 mb-6">
              <h1 className="text-2xl font-bold tracking-tight">{userDetails.username}</h1>
              <p className={`text-base ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{userDetails.displayName}</p>
              {userDetails.bio && (
                <p className={`text-sm leading-relaxed max-w-xs mx-auto ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {userDetails.bio}
                </p>
              )}
            </div>
            
            {/* Stats with One UI 7 Cards */}
            <div className="flex justify-center gap-8 mb-6">
              <button
                onClick={() => handleUserListClick('followers')}
                className={`text-center transition-transform active:scale-95 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
              >
                <div className="text-2xl font-bold">{followersData.length || 0}</div>
                <div className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Followers</div>
              </button>
              <button
                onClick={() => handleUserListClick('following')}
                className={`text-center transition-transform active:scale-95 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
              >
                <div className="text-2xl font-bold">{followingData.length || 0}</div>
                <div className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Following</div>
              </button>
            </div>
            
            {/* Action Buttons with One UI 7 Design */}
            <div className="flex flex-col gap-3 max-w-xs mx-auto">
              {userId !== currentUserId && (
                <button
                  onClick={handleFollowToggle}
                  className={`w-full py-3 px-6 rounded-2xl font-semibold text-sm transition-all duration-200 active:scale-95 ${
                    isFollowing 
                      ? `${isDarkMode ? 'bg-gray-800 text-gray-300 border border-gray-700' : 'bg-gray-100 text-gray-700 border border-gray-200'}` 
                      : 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                  }`}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
              )}
              <button
                onClick={shareProfile}
                className={`w-full py-3 px-6 rounded-2xl font-semibold text-sm transition-all duration-200 active:scale-95 ${
                  isDarkMode 
                    ? 'bg-gray-800 text-white border border-gray-700' 
                    : 'bg-white text-gray-700 border border-gray-200 shadow-sm'
                }`}
              >
                Share Profile
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Posts Section with One UI 7 Grid */}
      <div className="px-4 py-6">
        <div className="max-w-6xl mx-auto">
          <h2 className={`text-lg font-bold mb-4 px-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Posts ({userPosts.length})
          </h2>
          
          {userPosts.length === 0 ? (
            <div className={`text-center py-16 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-sm">No posts yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {userPosts.map(post => (
                <div
                  key={post.id}
                  className={`aspect-square rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 active:scale-95 ${
                    isDarkMode ? 'bg-gray-800' : 'bg-white'
                  } shadow-sm hover:shadow-md`}
                  onClick={() => handlePostClick(post)}
                >
                  {renderPostContent(post)}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Post Modal */}
      <Modal open={isPostModalOpen} onClose={() => setIsPostModalOpen(false)}>
        <div className="flex items-center justify-center min-h-screen p-4">
          <div className={`w-full max-w-4xl mx-auto rounded-3xl shadow-2xl overflow-hidden ${
            isDarkMode ? 'bg-gray-900 border border-gray-800' : 'bg-white'
          }`}>
            {selectedPost && (
              <>
                {/* Modal Header */}
                <div className={`px-6 py-4 border-b ${isDarkMode ? 'border-gray-800' : 'border-gray-100'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar
                        src={userDetails.avatar || ''}
                        alt="Profile"
                        style={{ width: '48px', height: '48px' }}
                      />
                      <div>
                        <h3 className="text-lg font-bold">{userDetails.username}</h3>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {userDetails.displayName}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsPostModalOpen(false)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                        isDarkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
                      }`}
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Post Content */}
                <div className="p-6">
                  {/* Caption */}
                  {selectedPost.caption && (
                    <div className="mb-6">
                      <p className={`text-lg leading-relaxed ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                        {selectedPost.caption}
                      </p>
                    </div>
                  )}

                  {/* Media */}
                  <div className="flex justify-center">
                    {renderFullPostContent(selectedPost)}
                  </div>

                  {/* Post Info */}
                  <div className={`mt-6 pt-4 border-t ${isDarkMode ? 'border-gray-800' : 'border-gray-100'}`}>
                    <div className="flex items-center justify-between text-sm">
                      <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                        {selectedPost.timestamp ? new Date(selectedPost.timestamp.seconds * 1000).toLocaleDateString() : 'Recently posted'}
                      </span>
                      <div className="flex items-center space-x-4">
                        <button className={`flex items-center space-x-2 transition-colors ${
                          isDarkMode ? 'text-gray-400 hover:text-red-400' : 'text-gray-500 hover:text-red-500'
                        }`}>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                          <span>Like</span>
                        </button>
                        <button className={`flex items-center space-x-2 transition-colors ${
                          isDarkMode ? 'text-gray-400 hover:text-blue-400' : 'text-gray-500 hover:text-blue-500'
                        }`}>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          <span>Comment</span>
                        </button>
                        <button className={`flex items-center space-x-2 transition-colors ${
                          isDarkMode ? 'text-gray-400 hover:text-green-400' : 'text-gray-500 hover:text-green-500'
                        }`}>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                          </svg>
                          <span>Share</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </Modal>
      
      {/* Followers/Following Modal with One UI 7 Design */}
      <Modal open={isUserListModalOpen} onClose={() => setIsUserListModalOpen(false)}>
        <div className="flex items-center justify-center min-h-screen p-4">
          <div className={`w-full max-w-sm mx-auto rounded-3xl shadow-2xl overflow-hidden ${
            isDarkMode ? 'bg-gray-900 border border-gray-800' : 'bg-white'
          }`}>
            {/* Modal Header */}
            <div className={`px-6 py-4 border-b ${isDarkMode ? 'border-gray-800' : 'border-gray-100'}`}>
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">
                  {listType === 'followers' ? 'Followers' : 'Following'}
                </h3>
                <button
                  onClick={() => setIsUserListModalOpen(false)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                    isDarkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* User List */}
            <div className="max-h-96 overflow-y-auto">
              {(listType === 'followers' ? followersData : followingData).map((user, index) => (
                <div key={index} className={`flex items-center p-4 transition-colors ${
                  isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'
                }`}>
                  <Avatar 
                    src={user.avatar || ''} 
                    alt={user.fullName}
                    className="mr-3"
                    style={{ width: '48px', height: '48px' }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{user.fullName || 'Anonymous User'}</p>
                  </div>
                </div>
              ))}
              {(listType === 'followers' ? followersData : followingData).length === 0 && (
                <div className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  <p className="text-sm">No {listType} yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default UserProfile;