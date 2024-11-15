import React, { useEffect, useState } from 'react';
import { getDatabase, ref, onValue, update, get } from 'firebase/database';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { FiThumbsUp, FiMessageSquare, FiShare2, FiUserPlus } from 'react-icons/fi';
import { auth } from './firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import Stories from './Stories';


const Feeds = () => {
  const [posts, setPosts] = useState([]);
  const [likedPosts, setLikedPosts] = useState({});
  const [avatars, setAvatars] = useState({});
  const [shareMessage, setShareMessage] = useState("");
  const [user, setUser] = useState(null);
  const db = getDatabase();
  const firestore = getFirestore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) setUser(user);
      else setUser(null);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const feedsRef = ref(db, 'feeds');
    const unsubscribe = onValue(feedsRef, async (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const postsArray = Object.values(data);
        setPosts(postsArray);

        const avatarPromises = postsArray.map(async (post) => {
          const avatar = await getUserAvatar(post.userId);
          setAvatars((prevAvatars) => ({
            ...prevAvatars,
            [post.userId]: avatar,
          }));
        });
        await Promise.all(avatarPromises);
      }
    });
    return () => unsubscribe();
  }, [user]);

  const getUserAvatar = async (userId) => {
    try {
      const userRef = doc(firestore, 'users', userId);
      const docSnap = await getDoc(userRef);
      return docSnap.exists() ? docSnap.data().avatar || 'https://via.placeholder.com/40' : 'https://via.placeholder.com/40';
    } catch {
      return 'https://via.placeholder.com/40';
    }
  };

  const handleLike = async (post, userId) => {
    const postRef = ref(db, `feeds/${post.id}`);
    const currentLikes = likedPosts[post.id] || {};
    const isLikedByUser = currentLikes[userId];
    const updatedLikes = { ...currentLikes, [userId]: !isLikedByUser };

    setLikedPosts((prevState) => ({
      ...prevState,
      [post.id]: updatedLikes,
    }));
    await update(postRef, { likes: Object.keys(updatedLikes).length });
  };

  const handleShare = (post) => {
    const shareableLink = `https://hiihive.vercel.app/${post.id}`;
    navigator.clipboard.writeText(shareableLink).then(() => {
      setShareMessage("Link copied to clipboard!");
      setTimeout(() => setShareMessage(""), 3000);
    });
  };

  const preventRightClick = (e) => {
    e.preventDefault();
  };

  useEffect(() => {
    document.addEventListener("contextmenu", preventRightClick);
    return () => {
      document.removeEventListener("contextmenu", preventRightClick);
    };
  }, []);

  return (
    <div className="max-h-[80vh] overflow-y-auto space-y-4 px-4 sm:px-6 lg:px-8">
      <Stories />
      {posts.length > 0 ? (
        posts.map((post) => (
          <div key={post.id} className="bg-white rounded-lg shadow-lg mb-4 w-full sm:max-w-[500px] mx-auto">
            <div className="flex items-center p-4">
              <img src={avatars[post.userId] || 'https://via.placeholder.com/40'} alt="User" className="w-10 h-10 rounded-full border-2 border-gray-300" />
              <div className="ml-3">
                <p className="font-semibold text-gray-800">{post.username}</p>
                <p className="text-sm text-gray-500">{new Date(post.timestamp).toLocaleTimeString()}</p>
              </div>
            </div>
            {post.fileType === 'image' && post.fileUrl && (
              <div
                className="relative w-full h-[300px] bg-cover bg-center"
                style={{ backgroundImage: `url(${post.fileUrl})` }}
              />
            )}
            {post.fileType === 'video' && post.fileUrl && (
              <div className="relative w-full h-[300px] bg-black">
                <video className="object-cover w-full h-full" onClick={(e) => e.preventDefault()}>
                  <source src={post.fileUrl} type="video/mp4" />
                </video>
              </div>
            )}
            {post.fileType === 'audio' && post.fileUrl && (
              <div className="p-4">
                <audio className="w-full" controls={false} onClick={(e) => e.preventDefault()}>
                  <source src={post.fileUrl} type="audio/mp3" />
                </audio>
              </div>
            )}
            {post.fileType === 'text' && post.caption && (
              <p className="p-4 text-gray-700">{post.caption}</p>
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
            {shareMessage && <div className="text-green-600 text-sm p-2">{shareMessage}</div>}
          </div>
        ))
      ) : (
        <div className="text-center">No posts available</div>
      )}
    </div>
  );
};

export default Feeds;
