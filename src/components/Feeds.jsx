import React, { useEffect, useState } from 'react';
import {
  getDatabase,
  get,
  ref,
  onValue,
  update,
  push,
  serverTimestamp,
} from 'firebase/database';
import './Feed.css';
import CustomVideoPlayer from './VideoPlayer';
import { FiThumbsUp, FiMessageCircle, FiShare } from 'react-icons/fi';
import { auth } from './firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import Voting from './voting'; // Import the Voting component
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import shuffle from 'lodash.shuffle'; // Import lodash shuffle function

// Register the required components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Feeds = () => {
  const [posts, setPosts] = useState([]);
  const [polls, setPolls] = useState([]);
  const [user, setUser] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState({});
  const [userDetails, setUserDetails] = useState({});
  const [expandedComments, setExpandedComments] = useState({});
  const [activeCommentPostId, setActiveCommentPostId] = useState(null); // Track active comment box
  const [shuffledContent, setShuffledContent] = useState([]); // State for shuffled content
  const db = getDatabase();
  const firestore = getFirestore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser || null);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchPosts = async () => {
      const postsRef = ref(db, 'feeds');
      onValue(postsRef, async (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const postsArray = await Promise.all(
            Object.entries(data).map(async ([id, post]) => {
              const userDetails = await fetchUserDetails(post.userId);
              return {
                id,
                ...post,
                userDetails,
              };
            })
          );
          setPosts(postsArray);
        }
      });
    };

    fetchPosts();
  }, []);

  useEffect(() => {
    const fetchPolls = async () => {
      const pollsRef = ref(db, 'polls');
      onValue(pollsRef, async (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const pollsArray = await Promise.all(
            Object.entries(data).map(async ([id, poll]) => {
              const userDetails = await fetchUserDetails(poll.createdBy);
              return {
                id,
                ...poll,
                userDetails,
              };
            })
          );
          setPolls(pollsArray);
        }
      });
    };

    fetchPolls();
  }, []);

  // Fetch user details from Firestore (for user name and avatar)
  const fetchUserDetails = async (uid) => {
    const userDoc = doc(firestore, 'users', uid);
    const userSnap = await getDoc(userDoc);
    if (userSnap.exists()) {
      return userSnap.data();
    } else {
      console.log("User not found in Firestore");
      return { fullName: "Unknown", username: "unknown", avatar: "" };
    }
  };

  // Combine posts and polls and shuffle the content
  useEffect(() => {
    const combinedContent = [...posts, ...polls.map(poll => ({ ...poll, isPoll: true }))];
    setShuffledContent(shuffle(combinedContent));
  }, [posts, polls]);

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

  // Handle comment button click
  const handleCommentButtonClick = (postId) => {
    setActiveCommentPostId(activeCommentPostId === postId ? null : postId);
  };

  // Fetch user ID by username
  const fetchUserIdByusername = async (username) => {
    const usersRef = collection(firestore, 'users');
    const q = query(usersRef, where('username', '==', username));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      return userDoc.id;
    }
    return null;
  };

  // Render caption with clickable usernames
  const renderCaptionWithusernames = (caption) => {
    const words = caption.split(' ');
    return words.map((word, index) => {
      if (word.startsWith('@')) {
        const username = word.slice(1);
        return (
          <span
            key={index}
            className="text-blue-500 cursor-pointer"
            onClick={async () => {
              const userId = await fetchUserIdByusername(username);
              if (userId) {
                handleUserProfileClick(userId);
              } else {
                alert('User not found');
              }
            }}
          >
            {word}
          </span>
        );
      }
      return <span key={index}>{word} </span>;
    });
  };

  const handleVote = async (pollId, optionIndex) => {
    if (!user) {
      alert("You need to be logged in to vote.");
      return;
    }

    const userVoteRef = ref(db, `polls/${pollId}/userVotes/${user.uid}`);
    const userVoteSnapshot = await get(userVoteRef);

    if (userVoteSnapshot.exists()) {
      alert("You have already voted.");
      return;
    }

    const pollRef = ref(db, `polls/${pollId}/votes`);
    const pollSnapshot = await get(pollRef);
    const currentVotes = pollSnapshot.val() || {};
    const updatedVotes = {
      ...currentVotes,
      [optionIndex]: (currentVotes[optionIndex] || 0) + 1,
    };

    await update(pollRef, updatedVotes);
    await update(userVoteRef, { voted: true });
  };

  const Poll = ({ poll, onVote }) => {
    const data = {
      labels: poll.options,
      datasets: [
        {
          label: 'Votes',
          data: poll.votes,
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
        },
      ],
    };

    const { userDetails = { fullName: "Unknown", username: "unknown", avatar: "" } } = poll;

    return (
      <div className="post bg-white rounded-lg shadow-lg overflow-hidden mb-6">
      {/* Post Header */}
      <div className="post-header flex items-center p-4">
        <img
          src={userDetails.avatar}
          alt="Avatar"
          className="avatar w-14 h-14 rounded-full object-cover border-2 border-blue-400"
        />
        <div className="user-info ml-4">
          <h4 className="text-lg font-semibold text-gray-800">{userDetails.fullName}</h4>
          <p className="text-sm text-gray-500">@{userDetails.username}</p>
        </div>
      </div>
    
      {/* Post Content */}
      <div className="post-content p-4">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">{poll.question}</h3>
        {/* Poll Chart */}
        <div className="mb-4">
          <Bar data={data} />
        </div>
    
        {/* Poll Options */}
        <div className="poll-options space-y-2">
          {poll.options.map((option, index) => (
            <button
              key={index}
              onClick={() => onVote(poll.id, index)}
              className="poll-option w-full py-2 px-4 bg-blue-500 text-white rounded-lg shadow-sm hover:bg-blue-600 transition duration-300 ease-in-out"
            >
              {option}
            </button>
          ))}
        </div>
      </div>
    </div>
    
    );
  };

  return (
    <div className="max-w-[600px] mx-auto px-4 sm:px-6 lg:px-8 bg-transparent text-black">
      {shuffledContent.map((content, index) => (
        content.isPoll ? (
          <Poll key={index} poll={content} onVote={handleVote} />
        ) : (
          <div
            key={content.id}
            className="bg-transparent mb-4 w-full sm:max-w-[500px] mx-auto"
          >
            {/* User Info */}
            <div className="flex items-center p-4">
              <img
                src={content.userDetails.avatar || "/default-avatar.png"}
                alt="User Avatar"
                className="w-10 h-10 rounded-full object-cover cursor-pointer"
                onClick={() => handleUserProfileClick(content.userId)} // Navigate to user profile
              />
              <div className="ml-3">
                <p className="font-semibold text-gray-800">
                  {content.userDetails.fullName || "Unknown User"}
                </p>
                <p className="text-sm text-gray-600">
                  @{content.userDetails.username || "unknown"}
                </p>
              </div>
            </div>

            {/* Post Media */}
            {content.fileType === "image" && content.fileUrl && (
              <img
                src={content.fileUrl}
                alt="Post"
                className="w-full h-auto rounded-lg"
              />
            )}
{content.fileType === "video" && content.fileUrl && (
  <CustomVideoPlayer videoUrl={content.fileUrl} />
)}

            {content.fileType === "audio" && content.fileUrl && (
              <audio className="w-full mt-4 rounded-lg" controls src={content.fileUrl} />
            )}
            {content.fileType === "text" && content.caption && (
              <p className="p-4 text-gray-800 bg-gray-100 rounded-lg">{renderCaptionWithusernames(content.caption)}</p>
            )}

            {/* Post Caption */}
            {content.caption && (
              <p className="p-4 text-gray-800 bg-gray-100 rounded-lg dark:text-white dark:bg-black">
  {renderCaptionWithusernames(content.caption)}
</p>
            )}

            {/* Post Actions */}
            <div className="flex justify-between items-center p-4 border-t border-gray-300 bg-gray-100 rounded-b-lg dark:bg-black dark:border-gray-600">
            <button
                className={`flex items-center ${
                  content.likes?.[user?.uid] ? "text-blue-400" : "text-gray-600"
                } hover:text-blue-300 transition duration-300 ease-in-out`}
                onClick={() => handleLike(content)}
              >
                <FiThumbsUp size={20} />
                <span className="ml-2">
                  {Object.keys(content.likes || {}).length} Likes
                </span>
              </button>
              <button
                className="flex items-center text-gray-600 hover:text-blue-300 transition duration-300 ease-in-out"
                onClick={() => handleCommentButtonClick(content.id)}
              >
                <FiMessageCircle size={20} />
                <span className="ml-2">Comment</span>
              </button>
              <button
                className="flex items-center text-gray-600 hover:text-blue-300 transition duration-300 ease-in-out"
                onClick={() => handleShare(content.id)} // Pass the post ID to share
              >
                <FiShare size={20} />
                <span className="ml-2">Share</span>
              </button>
            </div>

            {/* Comments Section */}
            {activeCommentPostId === content.id && (
              <div className="p-4">
                <input
                  type="text"
                  className="w-full border p-2 mb-2 bg-gray-100 text-black rounded-lg"
                  placeholder="Add a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                />
                <button
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg"
                  onClick={() => handleAddComment(content.id)}
                >
                  Post
                </button>

                {/* Display Comments */}
                <div className="mt-4 space-y-2">
                  {Object.values(comments[content.id] || {}).map((comment, index) => (
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
                            className="text-sm font-semibold cursor-pointer text-blue-400"
                            onClick={() => handleUserProfileClick(comment.userId)} // Navigate to user profile
                          >
                            {userDetails[comment.userId]?.fullName || "Unknown"}
                          </p>
                          <p className="text-sm text-gray-800">{comment.text}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      ))}
    </div>
  );
};

export default Feeds;