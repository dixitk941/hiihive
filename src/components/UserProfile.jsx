import React, { useEffect, useState } from 'react';
import { db, auth, storage } from './firebaseConfig';
import { addDoc, doc, getDoc, collection, getDocs, updateDoc, query, orderBy, limit } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { getDownloadURL, ref as storageRef } from "firebase/storage";
import { useParams, useNavigate } from 'react-router-dom';
import { arrayUnion, arrayRemove } from 'firebase/firestore';
import Avatar from '@mui/material/Avatar';
import Modal from '@mui/material/Modal';

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
    joinDate: '',
    location: '',
    website: '',
    verified: false,
    totalLikes: 0,
    totalViews: 0
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
  const [isOptionsModalOpen, setIsOptionsModalOpen] = useState(false);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [listType, setListType] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState('posts');
  const [userStats, setUserStats] = useState({
    postsCount: 0,
    likesCount: 0,
    viewsCount: 0,
    engagementRate: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [mutualFollowers, setMutualFollowers] = useState([]);
  const [isBlocked, setIsBlocked] = useState(false);
  useEffect(() => {
    // Only check localStorage, ignore system preference
    const savedTheme = localStorage.getItem('theme');
    
    // Default to light mode if no preference is saved
    const initialDarkMode = savedTheme === 'dark';
    
    setIsDarkMode(initialDarkMode);
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
              joinDate: userData.joinDate || '',
              location: userData.location || '',
              website: userData.website || '',
              verified: userData.verified || false,
              totalLikes: userData.totalLikes || 0,
              totalViews: userData.totalViews || 0
            });
            setIsFollowing(userData.followers?.includes(currentUserId) || false);
            setIsBlocked(userData.blockedUsers?.includes(currentUserId) || false);
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
          
          // Calculate stats
          const totalLikes = posts.reduce((sum, post) => sum + (post.likes?.length || 0), 0);
          const totalViews = posts.reduce((sum, post) => sum + (post.views || 0), 0);
          const engagementRate = posts.length > 0 ? ((totalLikes / posts.length) * 100).toFixed(1) : 0;
          
          setUserStats({
            postsCount: posts.length,
            likesCount: totalLikes,
            viewsCount: totalViews,
            engagementRate
          });
        } catch (error) {
          console.error('Error fetching user posts:', error);
        }
      }
    };
    fetchUserPosts();
  }, [userId]);

  useEffect(() => {
    const fetchMutualFollowers = async () => {
      if (currentUserId && userId && currentUserId !== userId && currentUserDetails.following) {
        const mutual = userDetails.followers.filter(follower => 
          currentUserDetails.following.includes(follower)
        );
        setMutualFollowers(mutual);
      }
    };
    fetchMutualFollowers();
  }, [currentUserId, userId, userDetails.followers, currentUserDetails.following]);

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
              username: userData.username || '',
              avatar: avatarUrl,
              verified: userData.verified || false
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
  }, [userDetails.followers, userDetails.following]);  const handleFollowToggle = async () => {
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
  
  const shareProfile = async () => {
    const profileLink = `https://hiihive.vercel.app/user/${userId}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${userDetails.username}'s Profile`,
          text: `Check out ${userDetails.displayName} on HiiHive!`,
          url: profileLink,
        });
      } catch (error) {
        console.log('Error sharing:', error);
        fallbackShare(profileLink);
      }
    } else {
      fallbackShare(profileLink);
    }
  };

  const fallbackShare = (url) => {
    navigator.clipboard.writeText(url);
    alert('Profile link copied to clipboard!');
  };

  const handleBlockUser = async () => {
    const currentUserRef = doc(db, 'users', currentUserId);
    
    try {
      if (isBlocked) {
        await updateDoc(currentUserRef, {
          blockedUsers: arrayRemove(userId),
        });
      } else {
        await updateDoc(currentUserRef, {
          blockedUsers: arrayUnion(userId),
          following: arrayRemove(userId),
        });
        
        const followedUserRef = doc(db, 'users', userId);
        await updateDoc(followedUserRef, {
          followers: arrayRemove(currentUserId),
        });
      }
      
      setIsBlocked(!isBlocked);
      setIsFollowing(false);
      setIsOptionsModalOpen(false);
    } catch (error) {
      console.error("Error blocking/unblocking user: ", error);
    }
  };

  const handlePostClick = (post) => {
    setSelectedPost(post);
    setIsPostModalOpen(true);
  };

  const handleUserListClick = (type) => {
    setListType(type);
    setIsUserListModalOpen(true);
  };

  const handleUserClick = (clickedUserId) => {
    setIsUserListModalOpen(false);
    navigate(`/user/${clickedUserId}`);
  };

  const renderPostContent = (post) => {
    const { fileType, fileUrl, caption } = post;

    if (fileType?.includes('image')) {
      return (
        <div className="relative w-full h-full">
          <img src={fileUrl} alt={caption} className="w-full h-full object-cover" />
          {post.likes?.length > 0 && (
            <div className="absolute top-2 right-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded-full">
              ❤️ {post.likes.length}
            </div>
          )}
        </div>
      );
    }
    if (fileType?.includes('video')) {
      return (
        <div className="relative w-full h-full">
          <video src={fileUrl} className="w-full h-full object-cover" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 bg-black bg-opacity-60 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className={`flex items-center justify-center h-full ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
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
    return (
      <div className={`flex items-center justify-center p-8 rounded-2xl ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
        <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 font-medium">
          Open File
        </a>
      </div>
    );
  };

  const formatJoinDate = (dateString) => {
    if (!dateString) return 'Recently joined';
    const date = new Date(dateString);
    return `Joined ${date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;
  };  if (loading) {
    return (
      <div className={`h-screen p-4 ${isDarkMode ? 'bg-black' : 'bg-gray-50'}`}>
        <div className="max-w-4xl mx-auto">
          {/* Profile header skeleton */}
          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-sm mb-6`}>
            <div className="flex flex-col md:flex-row items-center animate-pulse">
              <div className="w-32 h-32 rounded-full bg-gray-200 dark:bg-gray-700 mb-6 md:mb-0 md:mr-8"></div>
              
              <div className="flex-1 w-full text-center md:text-left">
                <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-4 mx-auto md:mx-0"></div>
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-40 mb-4 mx-auto md:mx-0"></div>
                
                <div className="flex flex-wrap justify-center md:justify-start gap-3 mb-4">
                  <div className="h-9 bg-gray-200 dark:bg-gray-700 rounded-full w-28"></div>
                  <div className="h-9 bg-gray-200 dark:bg-gray-700 rounded-full w-28"></div>
                </div>
                
                <div className="flex justify-center md:justify-start space-x-6 mb-4">
                  <div className="text-center">
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-10 mx-auto mb-1"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                  </div>
                  <div className="text-center">
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-10 mx-auto mb-1"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                  </div>
                  <div className="text-center">
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-10 mx-auto mb-1"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Profile content skeleton - Grid of posts */}
          <div className="grid grid-cols-3 gap-2 md:gap-4 animate-pulse">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            ))}
          </div>
        </div>
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
              {userDetails.verified && (
                <div className="absolute bottom-2 right-1/2 transform translate-x-1/2 translate-y-1/2">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center border-4 border-white">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  </div>
                </div>
              )}
            </div>
            
            {/* User Info */}
            <div className="space-y-2 mb-6">
              <div className="flex items-center justify-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight">{userDetails.username}</h1>
                {userDetails.verified && (
                  <svg className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                )}
              </div>
              <p className={`text-base ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{userDetails.displayName}</p>
              {userDetails.bio && (
                <p className={`text-sm leading-relaxed max-w-xs mx-auto ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {userDetails.bio}
                </p>
              )}
              
              {/* Additional Info */}
              <div className="space-y-1 text-xs">
                {userDetails.location && (
                  <div className={`flex items-center justify-center gap-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{userDetails.location}</span>
                  </div>
                )}
                {userDetails.website && (
                  <div className={`flex items-center justify-center gap-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    <a href={userDetails.website} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                      {userDetails.website.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                )}
                <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {formatJoinDate(userDetails.joinDate)}
                </p>
              </div>
            </div>
            
            {/* Stats with One UI 7 Cards */}
            <div className="flex justify-center gap-6 mb-6">
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
              <button
                onClick={() => setIsStatsModalOpen(true)}
                className={`text-center transition-transform active:scale-95 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
              >
                <div className="text-2xl font-bold">{userStats.likesCount}</div>
                <div className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Likes</div>
              </button>
            </div>

            {/* Mutual Followers */}
            {mutualFollowers.length > 0 && (
              <div className={`text-xs mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Followed by {mutualFollowers.length} people you follow
              </div>
            )}
            
            {/* Action Buttons with One UI 7 Design */}
            <div className="flex flex-col gap-3 max-w-xs mx-auto">
              <div className="flex gap-3">
                {userId !== currentUserId ? (
                  <>
                    <button
                      onClick={handleFollowToggle}
                      disabled={isBlocked}
                      className={`flex-1 py-3 px-6 rounded-2xl font-semibold text-sm transition-all duration-200 active:scale-95 ${
                        isBlocked 
                          ? `${isDarkMode ? 'bg-gray-800 text-gray-500 border border-gray-700' : 'bg-gray-100 text-gray-400 border border-gray-200'} cursor-not-allowed`
                          : isFollowing 
                            ? `${isDarkMode ? 'bg-gray-800 text-gray-300 border border-gray-700' : 'bg-gray-100 text-gray-700 border border-gray-200'}` 
                            : 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                      }`}
                    >
                      {isBlocked ? 'Blocked' : isFollowing ? 'Following' : 'Follow'}
                    </button>
                    <button
                      onClick={() => setIsOptionsModalOpen(true)}
                      className={`py-3 px-4 rounded-2xl font-semibold text-sm transition-all duration-200 active:scale-95 ${
                        isDarkMode 
                          ? 'bg-gray-800 text-white border border-gray-700' 
                          : 'bg-white text-gray-700 border border-gray-200 shadow-sm'
                      }`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                      </svg>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => navigate('/settings')}
                    className={`w-full py-3 px-6 rounded-2xl font-semibold text-sm transition-all duration-200 active:scale-95 ${
                      isDarkMode 
                        ? 'bg-gray-800 text-white border border-gray-700' 
                        : 'bg-white text-gray-700 border border-gray-200 shadow-sm'
                    }`}
                  >
                    Edit Profile
                  </button>
                )}
              </div>
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
      
      {/* Tab Navigation */}
      <div className="sticky top-0 z-40 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="flex justify-center">
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-2xl p-1 m-4">
            {['posts', 'media', 'likes'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2 rounded-xl font-medium text-sm transition-all duration-200 capitalize ${
                  activeTab === tab
                    ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Content based on active tab */}
      <div className="px-4 py-6">
        <div className="max-w-6xl mx-auto">
          {activeTab === 'posts' && (
            <>
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
            </>
          )}

          {activeTab === 'media' && (
            <>
              <h2 className={`text-lg font-bold mb-4 px-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Media ({userPosts.filter(post => post.fileType?.includes('image') || post.fileType?.includes('video')).length})
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {userPosts
                  .filter(post => post.fileType?.includes('image') || post.fileType?.includes('video'))
                  .map(post => (
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
            </>
          )}

          {activeTab === 'likes' && (
            <div className={`text-center py-16 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <p className="text-sm">Liked posts are private</p>
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
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold">{userDetails.username}</h3>
                          {userDetails.verified && (
                            <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                          )}
                        </div>
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
                          <span>{selectedPost.likes?.length || 0}</span>
                        </button>
                        <button className={`flex items-center space-x-2 transition-colors ${
                          isDarkMode ? 'text-gray-400 hover:text-blue-400' : 'text-gray-500 hover:text-blue-500'
                        }`}>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          <span>Comment</span>
                        </button>
                        <button 
                          onClick={shareProfile}
                          className={`flex items-center space-x-2 transition-colors ${
                            isDarkMode ? 'text-gray-400 hover:text-green-400' : 'text-gray-500 hover:text-green-500'
                          }`}
                        >
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

      {/* Stats Modal */}
      <Modal open={isStatsModalOpen} onClose={() => setIsStatsModalOpen(false)}>
        <div className="flex items-center justify-center min-h-screen p-4">
          <div className={`w-full max-w-md mx-auto rounded-3xl shadow-2xl overflow-hidden ${
            isDarkMode ? 'bg-gray-900 border border-gray-800' : 'bg-white'
          }`}>
            <div className={`px-6 py-4 border-b ${isDarkMode ? 'border-gray-800' : 'border-gray-100'}`}>
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">Profile Stats</h3>
                <button
                  onClick={() => setIsStatsModalOpen(false)}
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
            
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>Total Posts</span>
                <span className="font-bold text-blue-600">{userStats.postsCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>Total Likes</span>
                <span className="font-bold text-red-500">{userStats.likesCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>Total Views</span>
                <span className="font-bold text-green-600">{userStats.viewsCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>Engagement Rate</span>
                <span className="font-bold text-purple-600">{userStats.engagementRate}%</span>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* Options Modal */}
      <Modal open={isOptionsModalOpen} onClose={() => setIsOptionsModalOpen(false)}>
        <div className="flex items-center justify-center min-h-screen p-4">
          <div className={`w-full max-w-sm mx-auto rounded-3xl shadow-2xl overflow-hidden ${
            isDarkMode ? 'bg-gray-900 border border-gray-800' : 'bg-white'
          }`}>
            <div className={`px-6 py-4 border-b ${isDarkMode ? 'border-gray-800' : 'border-gray-100'}`}>
              <h3 className="text-xl font-bold">Options</h3>
            </div>
            
            <div className="p-2">
              <button
                onClick={handleBlockUser}
                className={`w-full p-4 text-left rounded-2xl transition-colors ${
                  isDarkMode ? 'hover:bg-gray-800 text-red-400' : 'hover:bg-gray-50 text-red-600'
                }`}
              >
                {isBlocked ? 'Unblock User' : 'Block User'}
              </button>
              <button
                onClick={() => {/* Report user logic */}}
                className={`w-full p-4 text-left rounded-2xl transition-colors ${
                  isDarkMode ? 'hover:bg-gray-800 text-orange-400' : 'hover:bg-gray-50 text-orange-600'
                }`}
              >
                Report User
              </button>
            </div>
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
                <div 
                  key={index} 
                  className={`flex items-center p-4 transition-colors cursor-pointer ${
                    isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => handleUserClick(user.id)}
                >
                  <Avatar 
                    src={user.avatar || ''} 
                    alt={user.fullName}
                    className="mr-3"
                    style={{ width: '48px', height: '48px' }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{user.fullName || 'Anonymous User'}</p>
                      {user.verified && (
                        <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                      )}
                    </div>
                    {user.username && (
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        @{user.username}
                      </p>
                    )}
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

export default React.memo(UserProfile);