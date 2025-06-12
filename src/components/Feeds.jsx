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
import { FiThumbsUp, FiMessageCircle, FiShare, FiMoreHorizontal, FiHeart, FiBookmark } from 'react-icons/fi';
import { auth } from './firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import Voting from './voting';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import shuffle from 'lodash.shuffle';

// Register the required components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Feeds = () => {
  const [posts, setPosts] = useState([]);
  const [polls, setPolls] = useState([]);
  const [user, setUser] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [replyText, setReplyText] = useState("");
  const [comments, setComments] = useState({});
  const [userDetails, setUserDetails] = useState({});
  const [expandedComments, setExpandedComments] = useState({});
  const [activeCommentPostId, setActiveCommentPostId] = useState(null);
  const [activeReplyCommentId, setActiveReplyCommentId] = useState(null);
  const [shuffledContent, setShuffledContent] = useState([]);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [savedPosts, setSavedPosts] = useState(new Set());
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

  // Fetch comments for each post
  useEffect(() => {
    const fetchComments = () => {
      posts.forEach((post) => {
        const commentsRef = ref(db, `feeds/${post.id}/comments`);
        onValue(commentsRef, async (snapshot) => {
          const data = snapshot.val();
          if (data) {
            const commentsArray = await Promise.all(
              Object.entries(data).map(async ([commentId, comment]) => {
                const userDetails = await fetchUserDetails(comment.userId);
                
                // Fetch replies for this comment
                const repliesRef = ref(db, `feeds/${post.id}/comments/${commentId}/replies`);
                const repliesSnapshot = await get(repliesRef);
                const repliesData = repliesSnapshot.val();
                
                let replies = [];
                if (repliesData) {
                  replies = await Promise.all(
                    Object.entries(repliesData).map(async ([replyId, reply]) => {
                      const replyUserDetails = await fetchUserDetails(reply.userId);
                      return {
                        id: replyId,
                        ...reply,
                        userDetails: replyUserDetails,
                      };
                    })
                  );
                }

                return {
                  id: commentId,
                  ...comment,
                  userDetails,
                  replies: replies.sort((a, b) => a.timestamp - b.timestamp),
                };
              })
            );
            
            setComments(prev => ({
              ...prev,
              [post.id]: commentsArray.sort((a, b) => a.timestamp - b.timestamp),
            }));
          } else {
            setComments(prev => ({
              ...prev,
              [post.id]: [],
            }));
          }
        });
      });
    };

    if (posts.length > 0) {
      fetchComments();
    }
  }, [posts]);

  const fetchUserDetails = async (uid) => {
    // Check if we already have the user details cached
    if (userDetails[uid]) {
      return userDetails[uid];
    }

    const userDoc = doc(firestore, 'users', uid);
    const userSnap = await getDoc(userDoc);
    if (userSnap.exists()) {
      const userData = userSnap.data();
      setUserDetails(prev => ({
        ...prev,
        [uid]: userData,
      }));
      return userData;
    } else {
      console.log("User not found in Firestore");
      const defaultUser = { fullName: "Unknown", username: "unknown", avatar: "" };
      setUserDetails(prev => ({
        ...prev,
        [uid]: defaultUser,
      }));
      return defaultUser;
    }
  };

  useEffect(() => {
    if (posts.length > 0 || polls.length > 0) {
      if (!initialLoadComplete) {
        const combinedContent = [...posts, ...polls.map(poll => ({ ...poll, isPoll: true }))];
        setShuffledContent(shuffle(combinedContent));
        setInitialLoadComplete(true);
      } else {
        const updatedContent = shuffledContent.map(item => {
          if (item.isPoll) {
            const updatedPoll = polls.find(poll => poll.id === item.id);
            return updatedPoll ? { ...updatedPoll, isPoll: true } : item;
          } else {
            const updatedPost = posts.find(post => post.id === item.id);
            return updatedPost || item;
          }
        });
        setShuffledContent(updatedContent);
      }
    }
  }, [posts, polls]);

  const handleLike = async (post) => {
    if (!user) return alert("You must be logged in to like posts.");
    const postRef = ref(db, `feeds/${post.id}/likes`);
    const isLiked = post.likes?.[user.uid];

    try {
      if (!isLiked) {
        await update(postRef, { [user.uid]: true });
      } else {
        await update(postRef, { [user.uid]: null });
      }
    } catch (error) {
      console.error("Failed to update likes:", error);
    }
  };

  const handleSavePost = (postId) => {
    setSavedPosts(prev => {
      const newSaved = new Set(prev);
      if (newSaved.has(postId)) {
        newSaved.delete(postId);
      } else {
        newSaved.add(postId);
      }
      return newSaved;
    });
  };

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
      setCommentText("");
    } catch (error) {
      console.error("Failed to add comment:", error);
    }
  };

  const handleAddReply = async (postId, commentId) => {
    if (!replyText.trim()) return;
    if (!user) return alert("You must be logged in to reply.");

    const repliesRef = ref(db, `feeds/${postId}/comments/${commentId}/replies`);
    const newReply = {
      userId: user.uid,
      username: user.displayName || "Anonymous",
      fullName: user.displayName || "Unknown User",
      text: replyText,
      timestamp: serverTimestamp(),
    };

    try {
      await push(repliesRef, newReply);
      setReplyText("");
      setActiveReplyCommentId(null);
    } catch (error) {
      console.error("Failed to add reply:", error);
    }
  };

  const handleShare = (postId) => {
    const shareableLink = `https://hiihive.vercel.app/post/${postId}`;
    navigator.clipboard.writeText(shareableLink).then(() => {
      alert("Post link copied to clipboard!");
    }).catch((error) => {
      console.error("Failed to copy the link:", error);
    });
  };

  const handleUserProfileClick = (userId) => {
    window.location.href = `/user/${userId}`;
  };

  const handleCommentButtonClick = (postId) => {
    setActiveCommentPostId(activeCommentPostId === postId ? null : postId);
  };

  const handleReplyButtonClick = (commentId) => {
    setActiveReplyCommentId(activeReplyCommentId === commentId ? null : commentId);
  };

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

  const renderCaptionWithusernames = (caption) => {
    const words = caption.split(' ');
    return words.map((word, index) => {
      if (word.startsWith('@')) {
        const username = word.slice(1);
        return (
          <span
            key={index}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 cursor-pointer font-medium transition-colors duration-200"
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
          backgroundColor: 'rgba(59, 130, 246, 0.6)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 1,
          borderRadius: 8,
        },
      ],
    };

    const options = {
      responsive: true,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: 'white',
          bodyColor: 'white',
          cornerRadius: 8,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: document.documentElement.classList.contains('dark') ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
          },
          ticks: {
            color: document.documentElement.classList.contains('dark') ? '#9CA3AF' : '#374151',
          },
        },
        x: {
          grid: {
            display: false,
          },
          ticks: {
            color: document.documentElement.classList.contains('dark') ? '#9CA3AF' : '#374151',
          },
        },
      },
    };

    const { userDetails = { fullName: "Unknown", username: "unknown", avatar: "" } } = poll;

    return (
      <div className="bg-white dark:bg-black rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden mb-6 hover:shadow-md dark:hover:shadow-xl transition-shadow duration-300">
        {/* Poll Header */}
        <div className="flex items-center justify-between p-6 pb-4">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <img
                src={userDetails.avatar || "/default-avatar.png"}
                alt="Avatar"
                className="w-12 h-12 rounded-full object-cover ring-2 ring-blue-100 dark:ring-blue-900"
              />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white dark:border-black"></div>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white text-sm">{userDetails.fullName}</h4>
              <p className="text-gray-500 dark:text-gray-400 text-xs">@{userDetails.username} • 2h ago</p>
            </div>
          </div>
          <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors duration-200">
            <FiMoreHorizontal className="w-5 h-5 text-gray-400 dark:text-gray-500" />
          </button>
        </div>

        {/* Poll Content */}
        <div className="px-6 pb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 leading-relaxed">{poll.question}</h3>
          
          {/* Poll Chart */}
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
            <Bar data={data} options={options} />
          </div>

          {/* Poll Options */}
          <div className="space-y-3">
            {poll.options.map((option, index) => (
              <button
                key={index}
                onClick={() => onVote(poll.id, index)}
                className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 dark:from-blue-600 dark:to-blue-700 dark:hover:from-blue-700 dark:hover:to-blue-800 text-white rounded-xl font-medium shadow-sm hover:shadow-md transition-all duration-200 transform hover:scale-[1.02]"
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Component to render a single comment with replies
  const CommentThread = ({ comment, postId, depth = 0 }) => {
    const maxDepth = 3; // Limit nesting depth to prevent infinite threads
    const indentClass = depth > 0 ? 'ml-8 border-l-2 border-gray-200 dark:border-gray-700 pl-4' : '';

    return (
      <div className={`${indentClass} space-y-3`}>
        {/* Main Comment */}
        <div className="flex space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-900 rounded-xl transition-colors duration-200">
          <img
            src={comment.userDetails?.avatar || "/default-avatar.png"}
            alt="Commenter Avatar"
            className="w-8 h-8 rounded-full object-cover cursor-pointer flex-shrink-0"
            onClick={() => handleUserProfileClick(comment.userId)}
          />
          <div className="flex-1">
            <div className="bg-gray-100 dark:bg-gray-900 rounded-xl p-3">
              <p
                className="text-sm font-semibold cursor-pointer text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
                onClick={() => handleUserProfileClick(comment.userId)}
              >
                {comment.userDetails?.fullName || "Unknown"}
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{comment.text}</p>
            </div>
            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
              <button className="hover:text-blue-500 dark:hover:text-blue-400 transition-colors duration-200">Like</button>
              {depth < maxDepth && (
                <button 
                  onClick={() => handleReplyButtonClick(comment.id)}
                  className="hover:text-blue-500 dark:hover:text-blue-400 transition-colors duration-200"
                >
                  Reply
                </button>
              )}
              <span>2h ago</span>
              {comment.replies && comment.replies.length > 0 && (
                <span className="text-blue-600 dark:text-blue-400">
                  {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
                </span>
              )}
            </div>

            {/* Reply Input */}
            {activeReplyCommentId === comment.id && (
              <div className="mt-3 flex space-x-2">
                <img
                  src={user?.photoURL || "/default-avatar.png"}
                  alt="Your Avatar"
                  className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                />
                <div className="flex-1 space-y-2">
                  <textarea
                    className="w-full p-2 border border-gray-200 dark:border-gray-800 bg-white dark:bg-black text-gray-900 dark:text-white rounded-lg resize-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200 placeholder-gray-500 dark:placeholder-gray-400 text-sm"
                    placeholder="Write a reply..."
                    rows="2"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                  />
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => setActiveReplyCommentId(null)}
                      className="px-3 py-1 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-sm transition-colors duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      className="px-4 py-1 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white rounded-full text-sm font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => handleAddReply(postId, comment.id)}
                      disabled={!replyText.trim()}
                    >
                      Reply
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="space-y-2">
            {comment.replies.map((reply) => (
              <CommentThread 
                key={reply.id} 
                comment={reply} 
                postId={postId} 
                depth={depth + 1} 
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 bg-gray-50 dark:bg-black min-h-screen transition-colors duration-300">
      <div className="space-y-6">
        {shuffledContent.map((content, index) => (
          content.isPoll ? (
            <Poll key={`poll-${content.id}`} poll={content} onVote={handleVote} />
          ) : (
            <div
              key={`post-${content.id}`}
              className="bg-white dark:bg-black rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden hover:shadow-md dark:hover:shadow-xl transition-shadow duration-300"
            >
              {/* Post Header */}
              <div className="flex items-center justify-between p-6 pb-4">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <img
                      src={content.userDetails?.avatar || "/default-avatar.png"}
                      alt="User Avatar"
                      className="w-12 h-12 rounded-full object-cover cursor-pointer ring-2 ring-blue-100 dark:ring-blue-900 hover:ring-blue-200 dark:hover:ring-blue-800 transition-all duration-200"
                      onClick={() => handleUserProfileClick(content.userId)}
                    />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white dark:border-black"></div>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors duration-200"
                       onClick={() => handleUserProfileClick(content.userId)}>
                      {content.userDetails?.fullName || "Unknown User"}
                    </p>
                    <p className="text-gray-500 dark:text-gray-400 text-xs">
                      @{content.userDetails?.username || "unknown"} • 2h ago
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => handleSavePost(content.id)}
                    className={`p-2 rounded-full transition-colors duration-200 ${
                      savedPosts.has(content.id) 
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' 
                        : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 dark:text-gray-500'
                    }`}
                  >
                    <FiBookmark className="w-5 h-5" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors duration-200">
                    <FiMoreHorizontal className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                  </button>
                </div>
              </div>

              {/* Post Caption */}
              {content.caption && (
                <div className="px-6 pb-4">
                  <p className="text-gray-800 dark:text-gray-200 leading-relaxed">
                    {renderCaptionWithusernames(content.caption)}
                  </p>
                </div>
              )}

              {/* Post Media */}
              <div className="relative">
                {content.fileType === "image" && content.fileUrl && (
                  <img
                    src={content.fileUrl}
                    alt="Post"
                    className="w-full h-auto max-h-96 object-cover"
                  />
                )}
                {content.fileType === "video" && content.fileUrl && (
                  <div className="bg-black">
                    <CustomVideoPlayer videoUrl={content.fileUrl} />
                  </div>
                )}
                {content.fileType === "audio" && content.fileUrl && (
                  <div className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
                    <audio className="w-full rounded-lg" controls src={content.fileUrl} />
                  </div>
                )}
                {content.fileType === "text" && !content.fileUrl && (
                  <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
                    <p className="text-gray-800 dark:text-gray-200 text-lg leading-relaxed">
                      {renderCaptionWithusernames(content.caption)}
                    </p>
                  </div>
                )}
              </div>

              {/* Post Actions */}
              <div className="p-6 pt-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-6">
                    <button
                      className={`flex items-center space-x-2 group transition-all duration-200 ${
                        content.likes?.[user?.uid] 
                          ? "text-red-500" 
                          : "text-gray-600 dark:text-gray-400 hover:text-red-500"
                      }`}
                      onClick={() => handleLike(content)}
                    >
                      <div className={`p-2 rounded-full transition-colors duration-200 ${
                        content.likes?.[user?.uid] 
                          ? "bg-red-50 dark:bg-red-900/20" 
                          : "group-hover:bg-red-50 dark:group-hover:bg-red-900/20"
                      }`}>
                        <FiHeart 
                          className={`w-5 h-5 ${content.likes?.[user?.uid] ? 'fill-current' : ''}`} 
                        />
                      </div>
                      <span className="text-sm font-medium">
                        {Object.keys(content.likes || {}).length}
                      </span>
                    </button>
                    
                    <button
                      className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 group transition-all duration-200"
                      onClick={() => handleCommentButtonClick(content.id)}
                    >
                      <div className="p-2 rounded-full group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 transition-colors duration-200">
                        <FiMessageCircle className="w-5 h-5" />
                      </div>
                      <span className="text-sm font-medium">
                        {comments[content.id] ? comments[content.id].length : 0} Comments
                      </span>
                    </button>
                    
                    <button
                      className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-green-500 dark:hover:text-green-400 group transition-all duration-200"
                      onClick={() => handleShare(content.id)}
                    >
                      <div className="p-2 rounded-full group-hover:bg-green-50 dark:group-hover:bg-green-900/20 transition-colors duration-200">
                        <FiShare className="w-5 h-5" />
                      </div>
                      <span className="text-sm font-medium">Share</span>
                    </button>
                  </div>
                </div>

                {/* Comments Section */}
                {activeCommentPostId === content.id && (
                  <div className="border-t border-gray-100 dark:border-gray-800 pt-4 space-y-4">
                    {/* Add Comment */}
                    <div className="flex space-x-3">
                      <img
                        src={user?.photoURL || "/default-avatar.png"}
                        alt="Your Avatar"
                        className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                      />
                      <div className="flex-1 space-y-3">
                        <textarea
                          className="w-full p-3 border border-gray-200 dark:border-gray-800 bg-white dark:bg-black text-gray-900 dark:text-white rounded-xl resize-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200 placeholder-gray-500 dark:placeholder-gray-400"
                          placeholder="Write a comment..."
                          rows="3"
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                        />
                        <div className="flex justify-end">
                          <button
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white rounded-full font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={() => handleAddComment(content.id)}
                            disabled={!commentText.trim()}
                          >
                            Post Comment
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Display Comments with Threads */}
                    <div className="space-y-4">
                      {comments[content.id] && comments[content.id].map((comment) => (
                        <CommentThread 
                          key={comment.id} 
                          comment={comment} 
                          postId={content.id} 
                          depth={0}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        ))}
      </div>
    </div>
  );
};

export default Feeds;