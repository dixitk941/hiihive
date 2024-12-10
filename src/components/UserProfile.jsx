import React, { useEffect, useState } from 'react';
import { db, auth, storage } from './firebaseConfig';
import { doc, getDoc, collection, getDocs, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { getDownloadURL, ref as storageRef } from "firebase/storage";
import { useParams } from 'react-router-dom';
import { arrayUnion, arrayRemove } from 'firebase/firestore';
import Avatar from '@mui/material/Avatar';
import Modal from '@mui/material/Modal';
import loaderGif from '../assets/normload.gif'; // Adjust path to loader asset

const UserProfile = () => {
  const { userId } = useParams();
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
  const [isFollowing, setIsFollowing] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [postCount, setPostCount] = useState(0);
  const [isUserListModalOpen, setIsUserListModalOpen] = useState(false);
  const [listType, setListType] = useState(null); // 'followers' or 'following'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUserId(user ? user.uid : null);
    });
    return () => unsubscribe();
  }, []);

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
          setPostCount(querySnapshot.size);
        } catch (error) {
          console.error('Error fetching user posts:', error);
        }
      }
    };
    fetchUserPosts();
  }, [userId]);

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

  const handleUserListClick = (userId) => {
    // Add your logic here
    console.log(`User with ID ${userId} clicked`);
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
    return (
      <div className="flex items-center justify-center bg-gray-200 h-64 text-gray-700">
        <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="underline">
          Open File
        </a>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col justify-center items-center bg-gray-100">
        <img src={loaderGif} alt="Loading" className="w-32 h-32" />
      </div>
    );
  }

  return (
    <div className="max-w-screen-lg mx-auto p-4 sm:p-6 bg-white relative pb-20">
      <div className="flex flex-col items-center text-center pb-6 mb-6 border-b border-gray-300">
        <Avatar
          src={userDetails.avatar || ''}
          alt="Profile"
          className="rounded-full border border-gray-300"
          style={{ width: '128px', height: '128px' }}
        />
        <h2 className="text-2xl font-semibold text-gray-900 mt-4">{userDetails.username}</h2>
        <p className="text-gray-500">{userDetails.displayName}</p>
        <p className="text-sm text-gray-400 mt-2">{userDetails.bio}</p>
        <div className="flex space-x-6 mt-4">
          <button
            className="text-sm font-semibold"
            onClick={() => handleUserListClick('followers')}
          >
            <span className="text-gray-900">{followersData.length || 0}</span> followers
          </button>
          <button
            className="text-sm font-semibold"
            onClick={() => handleUserListClick('following')}
          >
            <span className="text-gray-900">{followingData.length || 0}</span> following
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
      {/* Post Modal */}
      <Modal open={isPostModalOpen} onClose={() => setIsPostModalOpen(false)}>
        <div className="bg-white p-6 rounded-lg max-w-lg mx-auto mt-24 shadow-lg">
          {selectedPost && (
            <div>
              {renderPostContent(selectedPost)}
              <p className="mt-4 text-gray-700">{selectedPost.caption}</p>
            </div>
          )}
        </div>
      </Modal>
      {/* Branding */}
      <footer className="absolute bottom-0 left-0 right-0 p-4 bg-gray-100 text-center text-sm">
        <p>
          Designed by <span className="font-bold">Dixitk941</span> | Powered by{' '}
          <span className="font-bold">AINOR</span> | Logo by <span className="font-bold">Mayank Sharma</span>
        </p>
      </footer>
    </div>
  );
};

export default UserProfile;
