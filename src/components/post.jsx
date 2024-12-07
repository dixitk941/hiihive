import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getDatabase, ref, get } from 'firebase/database';
import { auth } from './firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { FiThumbsUp, FiMessageCircle, FiShare } from 'react-icons/fi';

const PostPage = () => {
  const { feedId } = useParams();
  const [post, setPost] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const db = getDatabase();
  const navigate = useNavigate();

  // Fetch post data from Firebase Realtime Database
  const fetchPost = async () => {
    setIsLoading(true);
    try {
      const postRef = ref(db, `feed/${feedId}`);
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

  const handleShare = () => {
    const shareableLink = `https://hiihive.vercel.app/post/${feedId}`;
    navigator.clipboard.writeText(shareableLink).then(() => {
      alert('Link copied to clipboard!');
    });
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        fetchPost();
      } else {
        setUser(null);
        setShowLoginPrompt(true);
      }
    });

    return () => unsubscribe();
  }, [feedId]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (showLoginPrompt) {
    return (
      <div className="text-center">
        <p>Please log in to view this post.</p>
        <button onClick={() => navigate('/login')} className="text-blue-500">
          Go to Login
        </button>
      </div>
    );
  }

  if (!post) {
    return <div>No post found!</div>;
  }

  return (
    <div>
      <h1>{post.title}</h1>
      <p>{post.content}</p>
      <div>
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
          onClick={handleShare}
        >
          <FiShare size={20} />
          <span className="ml-2">Share</span>
        </button>
      </div>
    </div>
  );
};

export default PostPage;
