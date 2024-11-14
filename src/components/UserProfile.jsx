import React, { useEffect, useState } from 'react';
import { db, auth, storage } from './firebaseConfig';
import { doc, getDoc, collection, getDocs, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { getDownloadURL, ref as storageRef } from "firebase/storage";
import { useParams } from 'react-router-dom';
import { arrayUnion, arrayRemove } from 'firebase/firestore';
import Avatar from '@mui/material/Avatar';

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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUserId(user.uid);
      } else {
        setCurrentUserId(null);
      }
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
            setIsFollowing(userData.followers?.includes(currentUserId) || false); // Check if the current user is following
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
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
        // Unfollow
        await updateDoc(currentUserRef, {
          following: arrayRemove({ id: userId, fullName: userDetails.displayName })
        });
        await updateDoc(followedUserRef, {
          followers: arrayRemove(currentUserId)
        });
      } else {
        // Follow
        await updateDoc(currentUserRef, {
          following: arrayUnion({ id: userId, fullName: userDetails.displayName })
        });
        await updateDoc(followedUserRef, {
          followers: arrayUnion(currentUserId)
        });
      }
      setIsFollowing(!isFollowing); // Toggle follow state
    } catch (error) {
      console.error("Error toggling follow status: ", error);
    }
  };

  return (
    <div className="max-w-screen-lg mx-auto p-4 sm:p-6 bg-white shadow-lg rounded-lg border border-gray-300">
      <div className="flex flex-col items-center md:flex-row md:items-start justify-between border-b border-gray-200 pb-6 mb-6">
        <div className="flex flex-col items-center md:items-start md:flex-row space-y-4 md:space-y-0 md:space-x-6">
          <Avatar
            src={userDetails.avatar || ''}
            alt="Profile"
            className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border border-gray-300 object-cover"
            style={{ width: '96px', height: '96px' }}
          >
            {!userDetails.avatar && userDetails.username[0]?.toUpperCase()}
          </Avatar>
          <div className="text-center md:text-left space-y-2">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">{userDetails.username}</h2>
            <p className="text-gray-600">{userDetails.displayName}</p>
            <p className="text-sm text-gray-500">{userDetails.bio}</p>
          </div>
        </div>
        <div className="flex flex-col items-center md:items-end mt-4 md:mt-0">
          {userId !== currentUserId && (
            <button
              onClick={handleFollowToggle}
              className={`px-4 py-2 text-sm font-semibold rounded-lg border ${
                isFollowing ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              {isFollowing ? 'Following' : 'Follow'}
            </button>
          )}
          <div className="mt-2 text-gray-500 text-sm">
            <span className="font-semibold">{userPosts.length}</span> Posts
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4 border-t border-gray-200 pt-4">
        {userPosts.map(post => (
          <div key={post.id} className="relative group border border-gray-300 rounded-lg overflow-hidden shadow-sm">
            <img src={post.imageUrl} alt={post.caption} className="w-full h-40 sm:h-64 object-cover transition-transform duration-300 ease-in-out transform group-hover:scale-105" />
            <div className="absolute inset-0 bg-black bg-opacity-25 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
              <p className="text-white text-center p-2 text-xs sm:text-sm">{post.caption}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserProfile;
