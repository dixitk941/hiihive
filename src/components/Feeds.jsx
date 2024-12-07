import React, { useEffect, useState } from 'react';
import { getDatabase, ref, get } from 'firebase/database';
import { auth } from './firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { FiThumbsUp, FiMessageCircle, FiShare } from 'react-icons/fi'; // Import icons

const PostPage = ({ match }) => {
  const [post, setPost] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const db = getDatabase();
  const history = useNavigate();

  // Fetch post data from Firebase Realtime Database
  const fetchPost = async (feedid) => {
    setIsLoading(true);
    try {
      const postRef = ref(db, `feed/${feedid}`); // Path to the 'feed' collection
      const snapshot = await get(postRef);
      if (snapshot.exists()) {
        setPost(snapshot.val());
      } else {
        console.log('No post found!');
      }
    } catch (error) {
      console.error('Error fetching post:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = (feedid) => {
    const shareableLink = `https://hiihive.vercel.app/post/${feedid}`;
    navigator.clipboard.writeText(shareableLink).then(() => {
      alert('Link copied to clipboard!');
    });
  };

  useEffect(() => {
    const feedid = match.params.feedid;
    if (feedid) {
      fetchPost(feedid);
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
      } else {
        setUser(null);
        setShowLoginPrompt(true);
      }
    });

    return () => unsubscribe();
  }, [match.params.feedid]);

  const handleLoginClick = () => {
    setShowLoginPrompt(false);
    history.push('/login'); // Redirect to login page
  };

  const handleUserProfileClick = (userId) => {
    history.push(`/profile/${userId}`);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-h-[80vh] overflow-y-auto space-y-4 px-4 sm:px-6 lg:px-8">
      {!user && showLoginPrompt && (
        <div className="bg-gray-100 p-4 rounded-lg shadow-lg text-center">
          <p className="text-lg font-semibold">Please log in to view the post</p>
          <button
            className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg"
            onClick={handleLoginClick}
          >
            Log In
          </button>
        </div>
      )}
      {user && post ? (
        <div className="bg-white rounded-lg shadow-lg mb-4 w-full sm:max-w-[500px] mx-auto">
          {/* User Info */}
          <div className="flex items-center p-4">
            <img
              src={post.userAvatar || '/default-avatar.png'}
              alt="User Avatar"
              className="w-10 h-10 rounded-full object-cover cursor-pointer"
              onClick={() => handleUserProfileClick(post.userId)} // Navigate to user profile
            />
            <div className="ml-3">
              <p className="font-semibold text-gray-800">{post.username}</p>
              <p className="text-sm text-gray-500">{post.userId}</p>
            </div>
          </div>

          {/* Post Media */}
          {post.fileType === 'image' && post.fileUrl && (
            <img src={post.fileUrl} alt="Post" className="w-full h-auto rounded-lg" />
          )}
          {post.fileType === 'video' && post.fileUrl && (
            <video className="w-full h-auto rounded-lg shadow-lg" controls src={post.fileUrl} />
          )}
          {post.fileType === 'audio' && post.fileUrl && (
            <audio className="w-full mt-4 rounded-lg shadow-lg" controls src={post.fileUrl} />
          )}
          {post.fileType === 'text' && post.caption && (
            <p className="p-4 text-gray-700 bg-gray-100 rounded-lg shadow-lg">{post.caption}</p>
          )}

          {/* Post Actions */}
          <div className="flex justify-between items-center p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg shadow-lg">
            <button className="flex items-center text-gray-600 hover:text-blue-500 transition duration-300 ease-in-out">
              <FiThumbsUp size={20} />
              <span className="ml-2">Like</span>
            </button>
            <button className="flex items-center text-gray-600 hover:text-blue-500 transition duration-300 ease-in-out">
              <FiMessageCircle size={20} />
              <span className="ml-2">Comment</span>
            </button>
            <button
              className="flex items-center text-gray-600 hover:text-blue-500 transition duration-300 ease-in-out"
              onClick={() => handleShare(post.id)} // Pass the post ID to share
            >
              <FiShare size={20} />
              <span className="ml-2">Share</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center">Post not found</div>
      )}
    </div>
  );
};

export default PostPage;
