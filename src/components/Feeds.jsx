import React, { useEffect, useState } from 'react';
import { getDatabase, ref, onValue, update, get } from 'firebase/database';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { FiThumbsUp, FiMessageSquare, FiShare2, FiUserPlus } from 'react-icons/fi';
import { auth } from './firebaseConfig'; // Import Firebase auth
import { onAuthStateChanged } from 'firebase/auth'; // Import Firebase auth state change listener

const Feeds = () => {
  const [posts, setPosts] = useState([]);
  const [likedPosts, setLikedPosts] = useState({});
  const [avatars, setAvatars] = useState({});
  const [shareMessage, setShareMessage] = useState("");
  const [user, setUser] = useState(null); // Add state for user
  const db = getDatabase();
  const firestore = getFirestore();

  useEffect(() => {
    // Listen to auth state changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user); // Set the user when logged in
      } else {
        setUser(null); // Clear user if logged out
      }
    });

    return () => unsubscribe(); // Cleanup on unmount
  }, []);

  useEffect(() => {
    if (!user) return;

    const feedsRef = ref(db, 'feeds');
    const unsubscribe = onValue(feedsRef, async (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const postsArray = Object.values(data).map((post) => ({
          ...post,
        }));
        setPosts(postsArray);

        const avatarPromises = postsArray.map(async (post) => {
          const avatar = await getUserAvatar(post.userId);
          setAvatars((prevAvatars) => ({
            ...prevAvatars,
            [post.userId]: avatar,
          }));
        });

        await Promise.all(avatarPromises);

        const likesPromises = postsArray.map(async (post) => {
          const postRef = ref(db, `feeds/${post.id}/likes`);
          const postSnapshot = await get(postRef);
          setLikedPosts((prevLikes) => ({
            ...prevLikes,
            [post.id]: postSnapshot.val() || {},
          }));
        });

        await Promise.all(likesPromises);
      }
    });

    return () => unsubscribe();
  }, [user]);

  const getUserAvatar = async (userId) => {
    if (!userId) {
      return 'https://via.placeholder.com/40';
    }

    try {
      const userRef = doc(firestore, 'users', userId);
      const docSnap = await getDoc(userRef);
      if (docSnap.exists()) {
        return docSnap.data().avatar || 'https://via.placeholder.com/40';
      } else {
        return 'https://via.placeholder.com/40';
      }
    } catch (error) {
      console.error('Error fetching user avatar:', error);
      return 'https://via.placeholder.com/40';
    }
  };

  const handleLike = async (post, userId) => {
    const postRef = ref(db, `feeds/${post.id}`);
    const currentLikes = likedPosts[post.id] || {};
    const isLikedByUser = currentLikes[userId];

    const updatedLikes = { ...currentLikes };

    if (isLikedByUser) {
      delete updatedLikes[userId];
    } else {
      updatedLikes[userId] = true;
    }

    setLikedPosts((prevState) => ({
      ...prevState,
      [post.id]: updatedLikes,
    }));

    await update(postRef, {
      likes: Object.keys(updatedLikes).length,
    });
  };

  const handleShare = (post) => {
    const shareableLink = `https://hiihive.vercel.app/${post.id}`;
    navigator.clipboard.writeText(shareableLink)
      .then(() => {
        setShareMessage("Link copied to clipboard!");
        setTimeout(() => setShareMessage(""), 3000);
      })
      .catch((err) => console.error('Error copying link: ', err));
  };

  const handleComment = async (post, comment) => {
    const postRef = ref(db, `feeds/${post.id}`);
    const updatedComments = post.comments || [];
    updatedComments.push(comment);
    await update(postRef, {
      comments: updatedComments,
    });
  };

  if (!user) {
    return <div>Please log in to view posts</div>;
  }

  return (
    <div className="max-h-[80vh] overflow-y-auto space-y-4 px-4 sm:px-6 lg:px-8">
      {posts.length > 0 ? (
        posts.map((post) => (
          <div key={post.id} className="bg-white rounded-lg shadow-lg mb-4 w-full sm:max-w-[500px] mx-auto">
            <div className="flex items-center p-4">
              <img
                src={avatars[post.userId] || 'https://via.placeholder.com/40'}
                alt="User"
                className="w-10 h-10 rounded-full border-2 border-gray-300"
              />
              <div className="ml-3">
                <p className="font-semibold text-gray-800">{post.username}</p>
                <p className="text-sm text-gray-500">{new Date(post.timestamp).toLocaleTimeString()}</p>
              </div>
            </div>
            {post.imageUrl && (
              <div className="relative w-full">
                <img src={post.imageUrl} alt="Post" className="object-cover w-full h-full" />
              </div>
            )}
            <div className="flex justify-between items-center p-4 border-t border-gray-200">
              <div className="flex space-x-4">
                <button
                  className={`flex items-center transition-all duration-300 ${
                    likedPosts[post.id] && likedPosts[post.id][user.uid] ? 'text-blue-600' : 'text-gray-600'
                  }`}
                  onClick={() => handleLike(post, user.uid)}
                >
                  <FiThumbsUp size={20} />
                  <span className="ml-2 hidden sm:inline">Like</span>
                </button>
                <p className="text-sm text-gray-600">{Object.keys(likedPosts[post.id] || {}).length} Likes</p>
                <button className="flex items-center text-gray-600 hover:text-blue-600">
                  <FiMessageSquare size={20} />
                  <span className="ml-2 hidden sm:inline">Comment</span>
                </button>
                <button
                  className="flex items-center text-gray-600 hover:text-blue-600"
                  onClick={() => handleShare(post)}
                >
                  <FiShare2 size={20} />
                  <span className="ml-2 hidden sm:inline">Share</span>
                </button>
              </div>
              <button className="flex items-center text-gray-600 hover:text-blue-600">
                <FiUserPlus size={20} />
                <span className="ml-2 hidden sm:inline">Follow</span>
              </button>
            </div>
            {post.caption && (
              <div className="p-4 text-gray-700">
                <p>{post.caption}</p>
              </div>
            )}
            {shareMessage && (
              <div className="text-green-600 text-sm p-2">{shareMessage}</div>
            )}
            <div className="p-4 border-t border-gray-200">
              <input
                type="text"
                className="w-full p-2 border rounded-lg"
                placeholder="Add a comment..."
                onKeyUp={(e) => {
                  if (e.key === 'Enter' && e.target.value.trim()) {
                    handleComment(post, e.target.value);
                    e.target.value = '';
                  }
                }}
              />
              <div>
                {post.comments && post.comments.map((comment, index) => (
                  <p key={index} className="text-sm text-gray-600">{comment}</p>
                ))}
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="text-center">No posts available</div>
      )}
    </div>
  );
};

export default Feeds;
