import React, { useEffect, useState } from 'react';
import {
  getDatabase,
  get,
  ref,
  onValue,
  update,
  push,
  serverTimestamp,
  remove,
} from 'firebase/database';
import './Feed.css';
import CustomVideoPlayer from './CustomVideoPlayer';
import { FiThumbsUp, FiMessageCircle, FiShare, FiMoreHorizontal, FiHeart, FiCpu, FiBookmark, FiGlobe, FiUsers, FiClock, FiTarget, FiBook, FiTrendingUp, FiZap, FiStar, FiAward, FiCalendar, FiDollarSign, FiMapPin, FiTag, FiImage, FiEdit, FiTrash2, FiEye } from 'react-icons/fi';
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
  const [userCollege, setUserCollege] = useState(null);
  const [feedMode, setFeedMode] = useState('global');
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
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Other existing state variables
  const [academicEvents, setAcademicEvents] = useState([]);
  const [knowledgeExchange, setKnowledgeExchange] = useState([]);
  const [contextualFeed, setContextualFeed] = useState('social'); // Changed default to social
  
  const db = getDatabase();
  const firestore = getFirestore();

  // Dark mode detection
  useEffect(() => {
    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDarkMode(prefersDarkMode);

    const handleThemeChange = (e) => {
      setIsDarkMode(e.matches);
    };

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', handleThemeChange);

    return () => {
      mediaQuery.removeEventListener('change', handleThemeChange);
    };
  }, []);

  // Fetch user college information
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser || null);
      if (currentUser) {
        try {
          const userDoc = doc(firestore, 'users', currentUser.uid);
          const userSnap = await getDoc(userDoc);
          if (userSnap.exists()) {
            const userData = userSnap.data();
            setUserCollege(userData.college || null);
            // Only default to college mode if user has a college AND we're still on default
            if (userData.college && feedMode === 'global' && !initialLoadComplete) {
              setFeedMode('college');
            }
          }
        } catch (error) {
          console.error("Error fetching user college:", error);
        }
      } else {
        setUserCollege(null);
        setFeedMode('global'); // Default to global for non-logged users
      }
    });
    return () => unsubscribe();
  }, [initialLoadComplete]); // Added initialLoadComplete as dependency

  // Filter content based on feed mode
  const filterContentByMode = (content) => {
    if (feedMode === 'global') {
      // Global mode should show ALL content regardless of college
      return content;
    } else if (feedMode === 'college' && userCollege) {
      // College mode should only show content from user's college
      return content.filter(item => {
        const itemCollege = item.userDetails?.college || item.college;
        return itemCollege === userCollege;
      });
    }
    // If no college is set, default to showing all content
    return content;
  };

  // ...existing useEffect for posts...
  useEffect(() => {
    const fetchPosts = async () => {
      const postsRef = ref(db, 'feeds');
      onValue(postsRef, async (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const postsArray = await Promise.all(
            Object.entries(data).map(async ([id, post]) => {
              // Validate post has userId
              if (!post.userId) {
                console.warn('Post missing userId:', id, post);
                return {
                  id,
                  ...post,
                  userDetails: { fullName: "Unknown User", username: "unknown", avatar: "", college: null },
                };
              }
              
              const userDetails = await fetchUserDetails(post.userId);
              return {
                id,
                ...post,
                userDetails,
              };
            })
          );
          setPosts(postsArray.filter(post => post !== null)); // Filter out any null posts
        } else {
          setPosts([]);
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
              // Validate poll has createdBy
              if (!poll.createdBy) {
                console.warn('Poll missing createdBy:', id, poll);
                return {
                  id,
                  ...poll,
                  userDetails: { fullName: "Unknown User", username: "unknown", avatar: "", college: null },
                };
              }
              
              const userDetails = await fetchUserDetails(poll.createdBy);
              return {
                id,
                ...poll,
                userDetails,
              };
            })
          );
          setPolls(pollsArray.filter(poll => poll !== null)); // Filter out any null polls
        } else {
          setPolls([]);
        }
      });
    };

    fetchPolls();
  }, []);

  // ...existing code for comments and user details...

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
                // Validate comment has userId
                if (!comment.userId) {
                  console.warn('Comment missing userId:', commentId, comment);
                  return {
                    id: commentId,
                    ...comment,
                    userDetails: { fullName: "Unknown User", username: "unknown", avatar: "", college: null },
                    replies: [],
                  };
                }

                const userDetails = await fetchUserDetails(comment.userId);
                
                // Fetch replies for this comment
                const repliesRef = ref(db, `feeds/${post.id}/comments/${commentId}/replies`);
                const repliesSnapshot = await get(repliesRef);
                const repliesData = repliesSnapshot.val();
                
                let replies = [];
                if (repliesData) {
                  replies = await Promise.all(
                    Object.entries(repliesData).map(async ([replyId, reply]) => {
                      // Validate reply has userId
                      if (!reply.userId) {
                        console.warn('Reply missing userId:', replyId, reply);
                        return {
                          id: replyId,
                          ...reply,
                          userDetails: { fullName: "Unknown User", username: "unknown", avatar: "", college: null },
                        };
                      }

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
                  replies: replies.filter(reply => reply !== null).sort((a, b) => a.timestamp - b.timestamp),
                };
              })
            );
            
            setComments(prev => ({
              ...prev,
              [post.id]: commentsArray.filter(comment => comment !== null).sort((a, b) => a.timestamp - b.timestamp),
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
    // Add validation for uid
    if (!uid || typeof uid !== 'string') {
      console.warn('Invalid uid provided to fetchUserDetails:', uid);
      const defaultUser = { fullName: "Unknown User", username: "unknown", avatar: "", college: null };
      return defaultUser;
    }

    // Check if we already have the user details cached
    if (userDetails[uid]) {
      return userDetails[uid];
    }

    try {
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
        console.log("User not found in Firestore for uid:", uid);
        const defaultUser = { fullName: "Unknown User", username: "unknown", avatar: "", college: null };
        setUserDetails(prev => ({
          ...prev,
          [uid]: defaultUser,
        }));
        return defaultUser;
      }
    } catch (error) {
      console.error("Error fetching user details for uid:", uid, error);
      const defaultUser = { fullName: "Unknown User", username: "unknown", avatar: "", college: null };
      setUserDetails(prev => ({
        ...prev,
        [uid]: defaultUser,
      }));
      return defaultUser;
    }
  };

  // Update content filtering when feed mode or content changes
  useEffect(() => {
    if (posts.length > 0 || polls.length > 0) {
      try {
        // First, properly tag all content types
        const postsWithTag = posts.map(post => ({ ...post, isPoll: false, contentType: 'post' }));
        const pollsWithTag = polls.map(poll => ({ ...poll, isPoll: true, contentType: 'poll' }));
        
        // Combine content
        const combinedContent = [...postsWithTag, ...pollsWithTag];
        
        // Apply filtering based on current feed mode
        const filteredContent = filterContentByMode(combinedContent);
        
        if (!initialLoadComplete) {
          // Initial load - do a proper shuffle using Fisher-Yates algorithm
          const shuffleArray = (array) => {
            const newArray = [...array];
            for (let i = newArray.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
            }
            return newArray;
          };
          
          console.log("Initial shuffling:", filteredContent.length, "items");
          const shuffled = shuffleArray(filteredContent);
          
          // Store the initial content order IDs to maintain order during updates
          const contentOrder = shuffled.map(item => ({
            id: item.id,
            contentType: item.contentType
          }));
          
          // Save this order to localStorage for persistence
          localStorage.setItem('contentOrder', JSON.stringify(contentOrder));
          
          setShuffledContent(shuffled);
          setInitialLoadComplete(true);
        } else {
          // On subsequent updates (like adding a like), maintain the same order
          try {
            // Get the saved content order
            const savedOrderString = localStorage.getItem('contentOrder');
            let orderedContent = [...filteredContent];
            
            if (savedOrderString) {
              const savedOrder = JSON.parse(savedOrderString);
              
              // Create a map of current content
              const contentMap = {};
              filteredContent.forEach(item => {
                contentMap[`${item.contentType}-${item.id}`] = item;
              });
              
              // Reorder content based on saved order, and add any new content at the end
              orderedContent = savedOrder
                .map(orderItem => contentMap[`${orderItem.contentType}-${orderItem.id}`])
                .filter(item => item !== undefined);
              
              // Add any new items that weren't in the original order
              const orderedIds = new Set(savedOrder.map(item => `${item.contentType}-${item.id}`));
              const newItems = filteredContent.filter(
                item => !orderedIds.has(`${item.contentType}-${item.id}`)
              );
              
              if (newItems.length > 0) {
                // Shuffle just the new items before adding them
                const shuffleArray = (array) => {
                  const newArray = [...array];
                  for (let i = newArray.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
                  }
                  return newArray;
                };
                orderedContent = [...orderedContent, ...shuffleArray(newItems)];
                
                // Update the saved order to include new items
                const updatedOrder = [
                  ...savedOrder,
                  ...newItems.map(item => ({
                    id: item.id,
                    contentType: item.contentType
                  }))
                ];
                localStorage.setItem('contentOrder', JSON.stringify(updatedOrder));
              }
            }
            
            setShuffledContent(orderedContent);
          } catch (error) {
            console.error("Error maintaining content order:", error);
            // Fallback to unshuffled content
            setShuffledContent(filteredContent);
          }
        }
      } catch (error) {
        console.error("Error processing content:", error);
        // Fallback in case of error
        const combinedContent = [
          ...posts.map(post => ({ ...post, isPoll: false })), 
          ...polls.map(poll => ({ ...poll, isPoll: true }))
        ];
        setShuffledContent(filterContentByMode(combinedContent));
      }
    }
  }, [posts, polls, feedMode, userCollege, initialLoadComplete]);

  // Also update this effect for feed mode changes
  useEffect(() => {
    // When feed mode changes, re-filter and reshuffle content
    if (initialLoadComplete && (posts.length > 0 || polls.length > 0)) {
      try {
        const combinedContent = [...posts, ...polls.map(poll => ({ ...poll, isPoll: true }))];
        const filteredContent = filterContentByMode(combinedContent);
        
        // Use a simple built-in shuffle algorithm
        const reshuffled = [...filteredContent].sort(() => Math.random() - 0.5);
        
        console.log("Re-shuffling after feed mode change:", reshuffled.length, "items");
        setShuffledContent(reshuffled);
      } catch (error) {
        console.error("Error re-shuffling content:", error);
      }
    }
  }, [feedMode]); // Only trigger when feedMode changes

  // Feed Mode Toggle Component with Samsung OneUI 7 design - Horizontal Layout
  const FeedModeToggle = () => {
    const handleModeChange = (newMode) => {
      console.log('Switching feed mode to:', newMode); // Debug log
      setFeedMode(newMode);
    };

    return (
      <div className="sticky top-0 z-10 bg-white/90 dark:bg-black/90 backdrop-blur-xl border-b border-gray-100/50 dark:border-gray-800/50 mb-6">
        <div className="max-w-2xl mx-auto px-6 py-4">
          {/* Main Content Container - Horizontal Layout */}
          <div className="flex items-center justify-between mb-4">
            {/* College Name on Left */}
            {userCollege && (
              <div className="flex-1 min-w-0 mr-6">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 tracking-wider uppercase mb-1">
                  College
                </p>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 truncate" title={userCollege}>
                  {userCollege}
                </p>
              </div>
            )}

            {/* Segmented Toggle on Right */}
            <div className="flex-shrink-0">
              <div className="relative bg-gray-100/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-full p-1.5 shadow-sm border border-gray-200/30 dark:border-gray-800/30">
                {/* Animated background pill */}
                <div 
                  className={`absolute top-1.5 h-[calc(100%-12px)] bg-white dark:bg-gray-800 rounded-full shadow-md transition-all duration-300 ease-out border border-gray-200/50 dark:border-gray-700/50 ${
                    feedMode === 'global' 
                      ? 'left-[calc(50%+3px)] w-[calc(50%-6px)]' 
                      : 'left-1.5 w-[calc(50%-6px)]'
                  }`}
                />
                
                {/* Toggle Buttons */}
                <div className="relative flex">
                  <button
                    onClick={() => handleModeChange('college')}
                    disabled={!userCollege}
                    className={`relative flex items-center justify-center space-x-2 px-4 py-2.5 rounded-full font-semibold transition-all duration-300 min-w-[100px] ${
                      feedMode === 'college'
                        ? 'text-gray-900 dark:text-white z-10'
                        : userCollege 
                          ? 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                          : 'text-gray-400 dark:text-gray-600 cursor-not-allowed opacity-60'
                    }`}
                  >
                    <FiUsers className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium">College</span>
                  </button>
                  
                  <button
                    onClick={() => handleModeChange('global')}
                    className={`relative flex items-center justify-center space-x-2 px-4 py-2.5 rounded-full font-semibold transition-all duration-300 min-w-[100px] ${
                      feedMode === 'global'
                        ? 'text-gray-900 dark:text-white z-10'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                    }`}
                  >
                    <FiGlobe className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium">Global</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Indicator - Show correct count */}
          <div className="text-center">
            <div className="inline-flex items-center space-x-2 px-3 py-1.5 bg-gray-50/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-full border border-gray-200/30 dark:border-gray-800/30">
              <div className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                feedMode === 'global' ? 'bg-blue-500' : 'bg-purple-500'
              }`} />
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                {shuffledContent.length} {shuffledContent.length === 1 ? 'post' : 'posts'} • {feedMode === 'global' ? 'Global' : 'College'} feed
              </span>
            </div>
          </div>

          {/* No College Warning */}
          {!userCollege && (
            <div className="mt-3 p-3 bg-amber-50/80 dark:bg-amber-900/20 backdrop-blur-sm rounded-xl border border-amber-200/30 dark:border-amber-800/30">
              <p className="text-xs text-amber-700 dark:text-amber-300 text-center font-medium">
                Set your college in profile to access college-specific content
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // College Badge Component
  const CollegeBadge = ({ college, isUserCollege = false }) => {
    if (!college) return null;
    
    // Truncate long college names
    const truncatedCollege = college.length > 15 ? `${college.substring(0, 15)}...` : college;
    
    return (
      <div 
        className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium max-w-[120px] ${
          isUserCollege 
            ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800'
            : 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
        }`}
        title={college} // Show full name on hover
      >
        <FiUsers className="w-2.5 h-2.5 mr-1 flex-shrink-0" />
        <span className="truncate">{truncatedCollege}</span>
      </div>
    );
  };

  // ...existing handlers remain the same...

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

  // Define renderPost function outside of Poll component
  const renderPost = (post) => (
    <div key={post.id} className="bg-white dark:bg-black rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden mb-6 hover:shadow-md dark:hover:shadow-xl transition-shadow duration-300">
      {/* Post Header */}
      <div className="flex items-center justify-between p-6 pb-4">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <div className="relative flex-shrink-0">
            <img
              src={post.userDetails?.avatar || "/default-avatar.png"}
              alt="Avatar"
              className="w-12 h-12 rounded-full object-cover ring-2 ring-blue-100 dark:ring-blue-900"
            />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white dark:border-black"></div>
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-gray-900 dark:text-white text-sm truncate">
              {post.userDetails?.fullName || "Unknown User"}
            </h4>
            <div className="flex items-center space-x-2">
              <p className="text-gray-500 dark:text-gray-400 text-xs truncate">
                @{post.userDetails?.username || "unknown"} • 2h ago
              </p>
              {post.userDetails?.college && (
                <CollegeBadge 
                  college={post.userDetails.college} 
                  isUserCollege={post.userDetails.college === userCollege}
                />
              )}
            </div>
          </div>
        </div>
        <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors duration-200 flex-shrink-0">
          <FiMoreHorizontal className="w-5 h-5 text-gray-400 dark:text-gray-500" />
        </button>
      </div>

      {/* Post Content */}
      <div className="px-6 pb-4">
        {post.caption && (
          <p className="text-gray-900 dark:text-white mb-4 leading-relaxed">
            {renderCaptionWithusernames(post.caption)}
          </p>
        )}
        
        {/* Media Content */}
        {post.fileUrl && (
          <div className="mb-4 rounded-xl overflow-hidden bg-black">
            {post.fileType === 'video' ? (
              <CustomVideoPlayer src={post.fileUrl} />
            ) : (
              <img 
                src={post.fileUrl} 
                alt="Post content" 
                className="w-full h-auto object-cover max-h-96"
                onError={(e) => {
                  console.error('Image load error:', e);
                  e.target.src = '/placeholder-image.png';
                }}
              />
            )}
          </div>
        )}
      </div>

      {/* Post Actions */}
      <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-gray-800">
        <div className="flex items-center space-x-6">
          <button
            onClick={() => handleLike(post)}
            className={`flex items-center space-x-2 transition-colors duration-200 ${
              post.likes?.[user?.uid] 
                ? 'text-red-600 dark:text-red-400' 
                : 'text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400'
            }`}
          >
            <FiHeart className={`w-5 h-5 ${post.likes?.[user?.uid] ? 'fill-current' : ''}`} />
            <span className="text-sm font-medium">
              {Object.keys(post.likes || {}).length}
            </span>
          </button>
          
          <button
            onClick={() => handleCommentButtonClick(post.id)}
            className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
          >
            <FiMessageCircle className="w-5 h-5" />
            <span className="text-sm font-medium">
              {comments[post.id]?.length || 0}
            </span>
          </button>
          
          <button
            onClick={() => handleShare(post.id)}
            className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors duration-200"
          >
            <FiShare className="w-5 h-5" />
            <span className="text-sm font-medium">Share</span>
          </button>
        </div>
        <button
          onClick={() => handleSavePost(post.id)}
          className={`p-2 rounded-full transition-colors duration-200 ${
            savedPosts.has(post.id)
              ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30'
              : 'text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30'
          }`}
        >
          <FiBookmark className={`w-5 h-5 ${savedPosts.has(post.id) ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* Comments Section */}
      {activeCommentPostId === post.id && (
        <div className="border-t border-gray-100 dark:border-gray-800 p-6">
          {/* Add Comment Input */}
          <div className="flex space-x-3 mb-6">
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
                  onClick={() => handleAddComment(post.id)}
                  disabled={!commentText.trim()}
                >
                  Comment
                </button>
              </div>
            </div>
          </div>

          {/* Comments List */}
          <div className="space-y-4">
            {comments[post.id]?.map((comment) => (
              <div key={comment.id} className="flex space-x-3">
                <img
                  src={comment.userDetails?.avatar || "/default-avatar.png"}
                  alt="Commenter Avatar"
                  className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-3">
                    <p className="font-medium text-gray-900 dark:text-white text-sm">
                      {comment.userDetails?.fullName || "Unknown User"}
                    </p>
                    <p className="text-gray-700 dark:text-gray-300 text-sm mt-1">
                      {comment.text}
                    </p>
                  </div>
                  <div className="flex items-center space-x-4 mt-2 ml-3">
                    <button
                      onClick={() => handleReplyButtonClick(comment.id)}
                      className="text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 font-medium"
                    >
                      Reply
                    </button>
                  </div>
                  
                  {/* Reply Input */}
                  {activeReplyCommentId === comment.id && (
                    <div className="mt-3 ml-3">
                      <div className="flex space-x-2">
                        <img
                          src={user?.photoURL || "/default-avatar.png"}
                          alt="Your Avatar"
                          className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                        />
                        <div className="flex-1">
                          <textarea
                            className="w-full p-2 border border-gray-200 dark:border-gray-800 bg-white dark:bg-black text-gray-900 dark:text-white rounded-lg resize-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent text-sm"
                            placeholder="Write a reply..."
                            rows="2"
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                          />
                          <div className="flex justify-end mt-2">
                            <button
                              className="px-4 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xs font-medium"
                              onClick={() => handleAddReply(post.id, comment.id)}
                              disabled={!replyText.trim()}
                            >
                              Reply
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Replies */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="mt-3 ml-3 space-y-2">
                      {comment.replies.map((reply) => (
                        <div key={reply.id} className="flex space-x-2">
                          <img
                            src={reply.userDetails?.avatar || "/default-avatar.png"}
                            alt="Reply Avatar"
                            className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                          />
                          <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-2">
                            <p className="font-medium text-gray-900 dark:text-white text-xs">
                              {reply.userDetails?.fullName || "Unknown User"}
                            </p>
                            <p className="text-gray-700 dark:text-gray-300 text-xs mt-1">
                              {reply.text}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const Poll = ({ poll, onVote }) => {
    // State for managing poll interactions
    const [votedOption, setVotedOption] = useState(null);
    const [isExpanded, setIsExpanded] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);
    
    // Calculate total votes for percentage
    const totalVotes = poll.votes ? Object.values(poll.votes).reduce((sum, count) => sum + count, 0) : 0;
    
    // Get user vote status from local storage to persist UI state
    const pollVoteKey = `poll_${poll.id}_voted`;
    const [hasVoted, setHasVoted] = useState(() => {
      return localStorage.getItem(pollVoteKey) !== null;
    });

    const handleVoteClick = (index) => {
      if (hasVoted) return;
      
      setVotedOption(index);
      setHasVoted(true);
      localStorage.setItem(pollVoteKey, index);
      onVote(poll.id, index);
      
      // Trigger confetti effect
      setShowConfetti(true);
      setTimeout(() => {
        setShowConfetti(false);
      }, 2000);
    };

    const { userDetails = { fullName: "Unknown", username: "unknown", avatar: "", college: null } } = poll;

    return (
      <div className={`bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-md border border-gray-100 dark:border-gray-700 overflow-hidden mb-6 transition-all duration-300 ${
        isExpanded ? 'scale-[1.02] shadow-xl' : 'hover:shadow-lg'
      }`}>
        {/* Confetti Effect (shows when user votes) */}
        {showConfetti && (
          <div className="absolute inset-0 z-10 pointer-events-none">
            <div className="absolute top-0 left-1/4 w-2 h-2 bg-blue-500 rounded-full animate-confetti-1"></div>
            <div className="absolute top-0 left-1/2 w-3 h-3 bg-green-500 rounded-full animate-confetti-2"></div>
            <div className="absolute top-0 right-1/4 w-2 h-2 bg-yellow-500 rounded-full animate-confetti-3"></div>
            <div className="absolute top-0 left-1/3 w-2 h-2 bg-purple-500 rounded-full animate-confetti-4"></div>
            <div className="absolute top-0 right-1/3 w-3 h-3 bg-pink-500 rounded-full animate-confetti-5"></div>
          </div>
        )}
        
        {/* Poll Header - Unique design with accent line */}
        <div className="border-l-4 border-purple-500 dark:border-purple-400">
          <div className="flex items-center justify-between p-4 pl-3">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <div className="relative flex-shrink-0">
                <img
                  src={userDetails.avatar || "/default-avatar.png"}
                  alt="Avatar"
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-purple-100 dark:ring-purple-900"
                />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white dark:border-gray-800"></div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center flex-wrap gap-2">
                  <h4 className="font-semibold text-gray-900 dark:text-white text-sm truncate">{userDetails.fullName}</h4>
                  <div className="flex space-x-2 items-center">
                    <span className="inline-flex items-center gap-1 bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300 text-xs px-2 py-0.5 rounded-full">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      Poll
                    </span>
                    {totalVotes > 10 && (
                      <span className="inline-flex items-center gap-1 bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300 text-xs px-2 py-0.5 rounded-full">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                        Trending
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <p className="text-gray-500 dark:text-gray-400 text-xs truncate">@{userDetails.username} • 2h ago</p>
                  {userDetails.college && (
                    <CollegeBadge 
                      college={userDetails.college} 
                      isUserCollege={userDetails.college === userCollege}
                    />
                  )}
                </div>
              </div>
            </div>
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors duration-200 flex-shrink-0"
            >
              {isExpanded ? (
                <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Poll Content - Enhanced with UI tricks */}
        <div className="px-5 pb-5">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 leading-relaxed">{poll.question}</h3>
          
          {/* Poll Options - Unique glass-morphism design with interactive elements */}
          <div className="space-y-3 mb-4">
            {poll.options.map((option, index) => {
              // Calculate percentage for this option
              const voteCount = poll.votes?.[index] || 0;
              const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
              const isUserVote = parseInt(localStorage.getItem(pollVoteKey)) === index;
              
              return (
                <button
                  key={index}
                  onClick={() => handleVoteClick(index)}
                  disabled={hasVoted}
                  className={`relative w-full py-4 px-4 rounded-xl font-medium text-sm text-left transition-all duration-500 overflow-hidden group
                    ${hasVoted 
                      ? 'backdrop-blur-sm' 
                      : 'hover:shadow-md hover:shadow-purple-100 dark:hover:shadow-purple-900/20 border border-transparent hover:border-purple-200 dark:hover:border-purple-700'
                    }
                    ${isUserVote ? 'bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-700' : 
                      hasVoted ? 'bg-gray-50/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700' :
                      'bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm'
                    }
                  `}
                >
                  {/* Background progress bar with animated entrance */}
                  {hasVoted && (
                    <div 
                      className={`absolute top-0 left-0 h-full transition-all duration-1000 ease-out ${
                        isUserVote
                          ? 'bg-gradient-to-r from-purple-100 to-purple-50 dark:from-purple-900/40 dark:to-purple-800/20' 
                          : 'bg-gradient-to-r from-gray-100 to-white dark:from-gray-700/40 dark:to-gray-800/20'
                      }`} 
                      style={{ 
                        width: `${percentage}%`,
                        animationDelay: `${index * 0.2}s` 
                      }}
                    />
                  )}
                  
                  {/* Option content with interactive elements */}
                  <div className="relative flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                      {!hasVoted && (
                        <div className="w-5 h-5 rounded-full border-2 border-purple-300 dark:border-purple-600 flex items-center justify-center group-hover:bg-purple-100 dark:group-hover:bg-purple-900/30 transition-colors duration-200">
                          {votedOption === index && (
                            <div className="w-3 h-3 bg-purple-500 rounded-full animate-ping-once"></div>
                          )}
                        </div>
                      )}
                      {hasVoted && isUserVote && (
                        <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                      {hasVoted && !isUserVote && (
                        <div className="w-5 h-5 rounded-full border-2 border-gray-300 dark:border-gray-600"></div>
                      )}
                      <span className={`${isUserVote ? 'text-purple-800 dark:text-purple-300 font-medium' : ''}`}>{option}</span>
                    </div>
                    
                    {hasVoted && (
                      <div className="flex items-center space-x-2">
                        <span className={`text-sm font-bold ${
                          isUserVote
                            ? 'text-purple-600 dark:text-purple-400' 
                            : 'text-gray-600 dark:text-gray-400'
                        }`}>
                          {percentage}%
                        </span>
                        {isUserVote && (
                          <span className="hidden md:inline-block ml-2 bg-purple-600 text-white text-xs px-2 py-0.5 rounded-full">
                            Your vote
                          </span>
                        )}
                        {voteCount > 0 && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            ({voteCount} {voteCount === 1 ? 'vote' : 'votes'})
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
          
          {/* Expanded Content - Additional information and interactions */}
          {isExpanded && (
            <div className="mt-4 space-y-4 animate-fade-in">
              {/* Poll Graph Visualization */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Vote Distribution</h4>
                <div className="h-32 flex items-end space-x-2">
                  {poll.options.map((option, index) => {
                    const voteCount = poll.votes?.[index] || 0;
                    const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
                    const isUserVote = parseInt(localStorage.getItem(pollVoteKey)) === index;
                    
                    return (
                      <div key={index} className="flex-1 flex flex-col items-center justify-end">
                        <div 
                          className={`w-full rounded-t-lg transition-all duration-1000 ${
                            isUserVote ? 'bg-purple-500 dark:bg-purple-600' : 'bg-gray-300 dark:bg-gray-600'
                          }`} 
                          style={{height: `${Math.max(percentage, 5)}%`}} 
                        />
                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-1 w-full text-center truncate" title={option}>
                          {option.length > 10 ? option.substring(0, 10) + '...' : option}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* Demographics (mock data) */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Top Voters</h4>
                <div className="flex -space-x-2 overflow-hidden">
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-gray-800 overflow-hidden bg-gray-200 dark:bg-gray-700">
                      <img 
                        src={`https://ui-avatars.com/api/?name=User+${i}&background=random`} 
                        alt={`Voter ${i}`}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ))}
                  <div className="flex items-center justify-center h-8 w-8 rounded-full ring-2 ring-white dark:ring-gray-800 bg-gray-100 dark:bg-gray-700 text-xs text-gray-500 dark:text-gray-400">
                    +{totalVotes > 5 ? totalVotes - 5 : 0}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Poll Stats and Actions */}
          <div className="flex items-center justify-between text-xs pt-4 border-t border-gray-100 dark:border-gray-800 mt-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1 text-gray-500 dark:text-gray-400">
                <FiUsers className="w-3.5 h-3.5" />
                <span>{totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}</span>
              </div>
              <div className="flex items-center space-x-1 text-gray-500 dark:text-gray-400">
                {hasVoted ? (
                  <>
                    <svg className="w-3.5 h-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-green-600 dark:text-green-400">Voted</span>
                  </>
                ) : (
                  <>
                    <FiClock className="w-3.5 h-3.5" />
                    <span>Vote now</span>
                  </>
                )}
              </div>
            </div>
            
            <div className="flex space-x-2">
              <button 
                className="flex items-center space-x-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                onClick={() => {
                  // Handle repost functionality
                  alert("Feature coming soon: Repost this poll");
                }}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Repost</span>
              </button>
              
              <button 
                className="flex items-center space-x-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                onClick={() => {
                  // Handle share poll
                  const pollLink = `https://hiihive.vercel.app/poll/${poll.id}`;
                  navigator.clipboard.writeText(pollLink);
                  alert("Poll link copied to clipboard!");
                }}
              >
                <FiShare className="w-3.5 h-3.5" />
                <span>Share</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Add a Poll Filter component
  const PollFilter = () => {
    const [pollFilter, setPollFilter] = useState('all');
    
    return (
      <div className="mb-6 p-4 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">Poll Filters</h3>
        <div className="flex flex-wrap gap-2">
          {['all', 'trending', 'voted', 'not-voted', 'college'].map(filter => (
            <button
              key={filter}
              onClick={() => setPollFilter(filter)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                pollFilter === filter
                  ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300 ring-1 ring-purple-200 dark:ring-purple-700'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {filter === 'all' && 'All Polls'}
              {filter === 'trending' && 'Trending'}
              {filter === 'voted' && 'Voted'}
              {filter === 'not-voted' && 'Not Voted'}
              {filter === 'college' && 'My College'}
            </button>
          ))}
        </div>
      </div>
    );
  };

  // Add Academic Event Card component
  const AcademicEventCard = ({ event }) => (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden mb-6 hover:shadow-md dark:hover:shadow-xl transition-shadow duration-300">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-2">{event.title}</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">by {event.organizer}</p>
            <p className="text-gray-700 dark:text-gray-300 text-sm mb-4">{event.description}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            event.type === 'seminar' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200' :
            event.type === 'workshop' ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200' :
            'bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-200'
          }`}>
            {event.type}
          </span>
        </div>
        
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <FiCalendar className="w-4 h-4" />
              <span>{event.date}</span>
            </div>
            <div className="flex items-center space-x-1">
              <FiClock className="w-4 h-4" />
              <span>{event.time}</span>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <FiUsers className="w-4 h-4" />
            <span>{event.attending} attending</span>
          </div>
        </div>
      </div>
    </div>
  );

  // Add greeting function
  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) {
      return { greeting: "Good morning! Start your day with some inspiration." };
    } else if (hour < 17) {
      return { greeting: "Good afternoon! What's happening in your college?" };
    } else {
      return { greeting: "Good evening! Catch up on today's highlights." };
    }
  };

  // Add Contextual Feed Tabs component
  const ContextualFeedTabs = () => (
    <div className="flex justify-center mb-6 overflow-x-auto">
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-1 shadow-sm border border-gray-100 dark:border-gray-800">
        {['social', 'polls', 'career', 'events'].map((tab) => (
          <button
            key={tab}
            onClick={() => setContextualFeed(tab)}
            className={`px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200 ${
              contextualFeed === tab
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            {tab === 'polls' ? (
              <div className="flex items-center space-x-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span>Polls</span>
              </div>
            ) : (
              tab.charAt(0).toUpperCase() + tab.slice(1)
            )}
          </button>
        ))}
      </div>
    </div>
  );

  // Move the contextual content logic outside of Poll component
  const renderContextualContent = () => {
    const contextualContent = {
      social: [
        ...shuffledContent
          .filter(item => !item.isPoll && item.category !== 'academic' && !item.tags?.includes('career'))
          .map(item => renderPost(item))
      ],
      polls: [
        // Dedicated polls section - shows only polls
        ...shuffledContent
          .filter(item => item.isPoll)
          .map(item => <Poll key={`poll-${item.id}`} poll={item} onVote={handleVote} />)
      ],
      career: [
        ...shuffledContent
          .filter(item => !item.isPoll && (item.tags?.includes('career') || item.tags?.includes('internship')))
          .map(item => renderPost(item))
      ],
      events: [
        ...(academicEvents.length === 0 ? [
          {
            id: 'event-1',
            title: 'Tech Talk: AI in Education',
            organizer: 'Computer Science Club',
            type: 'seminar',
            description: 'Join us for an exciting discussion about AI applications in modern education.',
            date: 'Dec 15, 2024',
            time: '3:00 PM',
            attending: 45
          },
          {
            id: 'event-2', 
            title: 'Career Fair 2024',
            organizer: 'Placement Cell',
            type: 'workshop',
            description: 'Meet top recruiters and explore career opportunities.',
            date: 'Dec 20, 2024',
            time: '10:00 AM',
            attending: 120
          }
        ] : academicEvents).map(event => <AcademicEventCard key={`event-${event.id}`} event={event} />),
        ...shuffledContent
          .filter(item => !item.isPoll && item.tags?.includes('event'))
          .map(item => renderPost(item))
      ],
    };

    if (contextualFeed === 'study') {
      setContextualFeed('social');
    }

    const currentContent = contextualContent[contextualFeed];
    if (!currentContent || currentContent.length === 0) {
      return (
        <div className="p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
            <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No content found</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {contextualFeed === 'polls' ? 'No polls available at the moment.' : 'Nothing to show here right now.'}
          </p>
        </div>
      );
    }

    return currentContent;
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 bg-gray-50 dark:bg-black min-h-screen transition-colors duration-300">
      {/* Time-based greeting */}
      <div className={`bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-2xl p-4 mb-6 border border-blue-200 dark:border-blue-800`}>
        <p className="text-center font-medium text-gray-900 dark:text-white">
          {getTimeBasedGreeting().greeting}
        </p>
      </div>

      {/* Contextual Feed Tabs */}
      <ContextualFeedTabs />

      {/* Feed Mode Toggle - Enhanced */}
      <FeedModeToggle />
      
      {/* Show Poll Filter only when viewing the polls tab */}
      {contextualFeed === 'polls' && <PollFilter />}
      
      <div className="space-y-6">
        {renderContextualContent()}
      </div>
    </div>
  );
};

export default Feeds;