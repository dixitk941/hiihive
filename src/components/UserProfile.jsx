import React, { useEffect, useState } from 'react';
import { db, auth, storage } from './firebaseConfig';
import { doc, getDoc, collection, getDocs, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { getDownloadURL, ref as storageRef } from "firebase/storage";
import { useParams } from 'react-router-dom';
import { arrayUnion, arrayRemove } from 'firebase/firestore';
import Avatar from '@mui/material/Avatar';
import loaderGif from '../assets/normload.gif'; // Adjust the path according to your project structure

const UserProfile = () => {
  const { userId } = useParams();
  const [userDetails, setUserDetails] = useState({
    displayName: '',
    avatar: '',
    username: '',
    bio: '',
  });
  const [userPosts, setUserPosts] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isProfilePicModalOpen, setIsProfilePicModalOpen] = useState(false);
  const [isPostVisible, setIsPostVisible] = useState(true);


  const handleClosePost = () => {
    setIsPostVisible(false);
  };

  const openModal = (post) => {
    setSelectedPost(post);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedPost(null);
  };

  const openProfilePicModal = () => {
    setIsProfilePicModalOpen(true);
  };

  const closeProfilePicModal = () => {
    setIsProfilePicModalOpen(false);
  };

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
            });
            setIsFollowing(userData.followers?.includes(currentUserId) || false);
          }
        } catch (error) {
          // console.error('Error fetching user data:', error);
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
          setUserPosts(posts);
        } catch (error) {
          // console.error('Error fetching user posts:', error);
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
          following: arrayRemove({ id: userId, fullName: userDetails.displayName })
        });
        await updateDoc(followedUserRef, {
          followers: arrayRemove(currentUserId)
        });
      } else {
        await updateDoc(currentUserRef, {
          following: arrayUnion({ id: userId, fullName: userDetails.displayName })
        });
        await updateDoc(followedUserRef, {
          followers: arrayUnion(currentUserId)
        });
      }
      setIsFollowing(!isFollowing);
    } catch (error) {
      // console.error("Error toggling follow status: ", error);
    }
  };

  const shareProfile = () => {
    const profileLink = `https://hiihive.vercel.app/user/${userId}`;
    navigator.clipboard.writeText(profileLink);
    alert('Profile link copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col justify-center items-center bg-gray-100">
      {/* Loader GIF in the center */}
      <div className="flex items-center justify-center mb-4">
        <img src={loaderGif} alt="Loading" className="w-32 h-32" /> {/* Increased size */}
      </div>
    </div>
    );
  }

  return (
    <div className="max-w-screen-lg mx-auto p-4 sm:p-6 bg-white">
      <div className="flex flex-col items-center text-center pb-6 mb-6 border-b border-gray-300">
      <Avatar
  src={userDetails.avatar || ''}
  alt="Profile"
  className="rounded-full border border-gray-300 cursor-pointer"
  style={{ width: '128px', height: '128px' }} // 128px is equivalent to 8rem (64 * 2)
  onClick={openProfilePicModal}
>
  {!userDetails.avatar && userDetails.username[0]?.toUpperCase()}
</Avatar>
        <h2 className="text-2xl font-semibold text-gray-900 mt-4">{userDetails.username}</h2>
        <p className="text-gray-500">{userDetails.displayName}</p>
        <p className="text-sm text-gray-400 mt-2">{userDetails.bio}</p>
        <div className="flex space-x-6 mt-4">
          <span className="text-sm font-semibold">
            <span className="text-gray-900">{userPosts.length}</span> posts
          </span>
          <span className="text-sm font-semibold">
            <span className="text-gray-900">{userDetails.followers?.length || 0}</span> followers
          </span>
          <span className="text-sm font-semibold">
            <span className="text-gray-900">{userDetails.following?.length || 0}</span> following
          </span>
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
        {/* Share Profile Button */}
        <button
          onClick={shareProfile}
          className="mt-4 px-6 py-2 text-sm font-semibold rounded-md bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:bg-blue-600 transition duration-300 ease-in-out"
        >
          Share Profile
        </button>
      </div>

      {/* Modal for Profile Picture */}
      {isProfilePicModalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={closeProfilePicModal}
        >
          <div className="bg-white rounded-lg overflow-hidden shadow-lg w-full max-w-lg">
            <img
              src={userDetails.avatar || ''}
              alt="Profile"
              className="w-full h-full object-cover"
            />
            <button
              className="absolute top-0 right-0 m-2 text-white font-semibold"
              onClick={closeProfilePicModal}
            >
              X
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 p-4">
  {userPosts.map(post => (
    <div key={post.id} className="relative group overflow-hidden rounded-lg shadow-lg">
      {post.fileType === 'image' && (
        <img
          src={post.fileUrl}
          alt={post.caption}
          className="w-full h-64 object-cover transition-transform duration-300 ease-in-out transform group-hover:scale-110 cursor-pointer"
          onClick={() => openModal(post)}
        />
      )}
      {post.fileType === 'video' && (
        <video
          src={post.fileUrl}
          className="w-full h-64 object-cover transition-transform duration-300 ease-in-out transform group-hover:scale-110 cursor-pointer"
          controls
          onClick={() => openModal(post)}
        />
      )}
      {post.fileType === 'audio' && (
        <div className="w-full h-64 bg-gray-200 flex items-center justify-center transition-transform duration-300 ease-in-out transform group-hover:scale-110 cursor-pointer">
          <audio
            src={post.fileUrl}
            className="w-full"
            controls
            onClick={() => openModal(post)}
          />
        </div>
      )}
      {post.fileType === 'text' && (
        <div
          className="w-full h-64 p-4 bg-gray-100 flex items-center justify-center transition-transform duration-300 ease-in-out transform group-hover:scale-110 cursor-pointer"
          onClick={() => openModal(post)}
        >
          <p className="text-gray-800 text-center">{post.textContent}</p>
        </div>
      )}
      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <button
          className="text-white font-semibold"
          onClick={() => openModal(post)}
        >
          View Post
        </button>
      </div>
    </div>
  ))}
</div>

      {/* Modal for Post Details */}
      {isModalOpen && selectedPost && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg shadow-lg max-w-lg w-full">
            <button
              className="absolute top-0 right-0 m-2 text-black font-semibold"
              onClick={closeModal}
            >
              X
            </button>
            {selectedPost.fileType === 'image' && (
              <img
                src={selectedPost.fileUrl}
                alt={selectedPost.caption}
                className="w-full h-auto"
              />
            )}
            {selectedPost.fileType === 'video' && (
              <video
                src={selectedPost.fileUrl}
                className="w-full h-auto"
                controls
              />
            )}
            {selectedPost.fileType === 'audio' && (
              <audio
                src={selectedPost.fileUrl}
                className="w-full"
                controls
              />
            )}
            {selectedPost.fileType === 'text' && (
              <div className="p-4 bg-gray-100">
                <p className="text-gray-800">{selectedPost.textContent}</p>
              </div>
            )}
          </div>
        </div>
      )}

<footer className="text-center mt-8 text-sm text-gray-500">
        <p>Developed by dixitk941 | Powered by AINOR</p>
      </footer>
    </div>
  );
};

export default UserProfile;
