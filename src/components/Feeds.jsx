import React, { useEffect, useState } from 'react';
import {
  getDatabase,
  ref,
  onValue,
  update,
  push,
  serverTimestamp,
} from 'firebase/database';
import { FiThumbsUp, FiMessageCircle, FiShare } from 'react-icons/fi';
import { auth } from './firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

const Feeds = () => {
  const [posts, setPosts] = useState([]);
  const [user, setUser] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState({});
  const [userDetails, setUserDetails] = useState({});
  const [expandedComments, setExpandedComments] = useState({});
  const db = getDatabase();
  const firestore = getFirestore();

  // Listen for authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser || null);
    });
    return () => unsubscribe();
  }, []);

  // Fetch user details from Firestore
  const fetchUserDetails = async (uid) => {
    const userDoc = doc(firestore, 'users', uid);
    const userSnap = await getDoc(userDoc);
    if (userSnap.exists()) {
      setUserDetails(prevState => ({ ...prevState, [uid]: userSnap.data() }));
    } else {
      console.log("User not found in Firestore");
    }
  };

  // Fetch posts from Realtime Database
  useEffect(() => {
    if (!user) return; // Prevent unauthorized reads
    const feedsRef = ref(db, 'feeds');
    const unsubscribe = onValue(feedsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const postsArray = Object.entries(data).map(([id, post]) => ({
          id,
          ...post,
        }));
        setPosts(postsArray);
      }
    });
    return () => unsubscribe();
  }, [user]);

  // Fetch comments in real-time
  useEffect(() => {
    if (!user) return; // Prevent unauthorized reads
    const feedsRef = ref(db, 'feeds');
    const unsubscribe = onValue(feedsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const allComments = Object.keys(data).reduce((acc, postId) => {
          acc[postId] = data[postId]?.comments || {};
          return acc;
        }, {});
        setComments(allComments);
      }
    });
    return () => unsubscribe();
  }, [user]);

  // Fetch user details for each post and comment
  useEffect(() => {
    posts.forEach(post => {
      if (post.userId && !userDetails[post.userId]) {
        fetchUserDetails(post.userId);
      }
      if (comments[post.id]) {
        Object.values(comments[post.id]).forEach(comment => {
          if (comment.userId && !userDetails[comment.userId]) {
            fetchUserDetails(comment.userId);
          }
        });
      }
    });
  }, [posts, comments, userDetails]);

  // Handle like functionality
  const handleLike = async (post) => {
    if (!user) return alert("You must be logged in to like posts.");
    const postRef = ref(db, `feeds/${post.id}/likes`);
    const isLiked = post.likes?.[user.uid];

    try {
      if (!isLiked) {
        await update(postRef, { [user.uid]: true });
      } else {
        await update(postRef, { [user.uid]: null }); // Remove the like
      }
    } catch (error) {
      console.error("Failed to update likes:", error);
    }
  };

  // Handle adding a comment
  const handleAddComment = async (postId) => {
    if (!commentText.trim()) return;
    if (!user) return alert("You must be logged in to comment.");

    const commentsRef = ref(db, `feeds/${postId}/comments`);
    const newComment = {
      userId: user.uid,
      username: user.displayName || "Anonymous",
      fullName: user.displayName || "Unknown User",
      text: commentText,
      timestamp: serverTimestamp(),
    };

    try {
      await push(commentsRef, newComment);
      setCommentText(""); // Reset comment input
    } catch (error) {
      console.error("Failed to add comment:", error);
    }
  };

  // Handle sharing posts
  const handleShare = (postId) => {
    const shareableLink = `https://hiihive.vercel.app/post/${postId}`;
    navigator.clipboard.writeText(shareableLink).then(() => {
      alert("Post link copied to clipboard!");
    }).catch((error) => {
      console.error("Failed to copy the link:", error);
    });
  };

  // Toggle expanded comments view
  const toggleExpandComments = (postId) => {
    setExpandedComments(prevState => ({
      ...prevState,
      [postId]: !prevState[postId],
    }));
  };

  // Handle user avatar click (Navigate to user profile)
  const handleUserProfileClick = (userId) => {
    window.location.href = `/user/${userId}`; // Redirect to profile page
  };

  return (
    <div className="max-h-[80vh] overflow-y-auto space-y-4 px-4 sm:px-6 lg:px-8">
      {posts.length > 0 ? (
        posts
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
          .map((post) => (
            <div
              key={post.id}
              className="bg-white rounded-lg shadow-lg mb-4 w-full sm:max-w-[500px] mx-auto"
            >
              {/* User Info */}
              <div className="flex items-center p-4">
                <img
                  src={userDetails[post.userId]?.avatar || "/default-avatar.png"}
                  alt="User Avatar"
                  className="w-10 h-10 rounded-full object-cover cursor-pointer"
                  onClick={() => handleUserProfileClick(post.userId)} // Navigate to user profile
                />
                <div className="ml-3">
                  <p className="font-semibold text-gray-800">
                    {userDetails[post.userId]?.fullName || "Unknown User"}
                  </p>
                  <p className="text-sm text-gray-500">
                    @{post.username || "Unknown"}
                  </p>
                </div>
              </div>

              {/* Post Media */}
              {post.fileType === "image" && post.fileUrl && (
                <img
                  src={post.fileUrl}
                  alt="Post"
                  className="w-full h-auto rounded-lg"
                />
              )}
              {post.fileType === "video" && post.fileUrl && (
                <video
                  className="w-full h-auto rounded-lg shadow-lg"
                  controls
                  src={post.fileUrl}
                />
              )}
              {post.fileType === "audio" && post.fileUrl && (
                <audio className="w-full mt-4 rounded-lg shadow-lg" controls src={post.fileUrl} />
              )}
              {post.fileType === "text" && post.caption && (
                <p className="p-4 text-gray-700 bg-gray-100 rounded-lg shadow-lg">{post.caption}</p>
              )}

              {/* Post Actions */}
              <div className="flex justify-between items-center p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg shadow-lg">
                <button
                  className={`flex items-center ${
                    post.likes?.[user?.uid] ? "text-blue-600" : "text-gray-600"
                  } hover:text-blue-500 transition duration-300 ease-in-out`}
                  onClick={() => handleLike(post)}
                >
                  <FiThumbsUp size={20} />
                  <span className="ml-2">
                    {Object.keys(post.likes || {}).length} Likes
                  </span>
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

              {/* Comments Section */}
              <div className="p-4">
                <input
                  type="text"
                  className="w-full border rounded-lg p-2 mb-2"
                  placeholder="Add a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                />
                <button
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg"
                  onClick={() => handleAddComment(post.id)}
                >
                  Post
                </button>

                {/* Display Comments */}
                <div className="mt-4 space-y-2">
                  {Object.values(comments[post.id] || {})
                    .slice(0, expandedComments[post.id] ? undefined : 2)
                    .map((comment, index) => (
                      <div key={index} className="bg-gray-100 p-2 rounded-lg">
                        <div className="flex items-center">
                          <img
                            src={userDetails[comment.userId]?.avatar || "/default-avatar.png"}
                            alt="Commenter Avatar"
                            className="w-8 h-8 rounded-full object-cover cursor-pointer"
                            onClick={() => handleUserProfileClick(comment.userId)} // Navigate to user profile
                          />
                          <div className="ml-3">
                            <p
                              className="text-sm font-semibold cursor-pointer text-blue-600"
                              onClick={() => handleUserProfileClick(comment.userId)} // Navigate to user profile
                            >
                              {userDetails[comment.userId]?.fullName || "Unknown"}
                            </p>
                            <p className="text-sm text-gray-600">{comment.text}</p>
                          </div>
                        </div>
                      </div>
                    ))}

                  {Object.values(comments[post.id] || {}).length > 2 && (
                    <button
                      className="text-blue-600"
                      onClick={() => toggleExpandComments(post.id)}
                    >
                      {expandedComments[post.id] ? "Show less" : `+${Object.values(comments[post.id]).length - 2} more`}
                    </button>
                  )}
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
