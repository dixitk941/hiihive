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
import { FiThumbsUp, FiMessageCircle, FiShare, FiMoreHorizontal, FiHeart, FiCpu,FiBookmark, FiGlobe, FiUsers, FiClock, FiTarget, FiBook, FiShoppingBag, FiTrendingUp, FiZap, FiStar, FiAward, FiCalendar, FiDollarSign, FiMapPin, FiTag, FiImage, FiEdit, FiTrash2, FiEye } from 'react-icons/fi';
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
  const [studyMood, setStudyMood] = useState('focused');
const [learningStreak, setLearningStreak] = useState(7);

const marketplaceCategories = [
  { value: 'all', label: 'All Items', icon: FiShoppingBag },
  { value: 'books', label: 'Books & Study Material', icon: FiBook },
  { value: 'electronics', label: 'Electronics & Gadgets', icon: FiZap },
  { value: 'furniture', label: 'Furniture & Decor', icon: FiTarget },
  { value: 'clothing', label: 'Clothing & Fashion', icon: FiTag },
  { value: 'sports', label: 'Sports & Fitness', icon: FiAward },
  { value: 'other', label: 'Other Items', icon: FiMoreHorizontal }
];

// Product conditions
const productConditions = [
  { value: 'new', label: 'Brand New', color: 'green' },
  { value: 'excellent', label: 'Excellent', color: 'blue' },
  { value: 'good', label: 'Good', color: 'yellow' },
  { value: 'fair', label: 'Fair', color: 'orange' },
  { value: 'poor', label: 'Poor', color: 'red' }
];

  
  // Marketplace state
  const [marketplaceItems, setMarketplaceItems] = useState([]);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [newItem, setNewItem] = useState({
    title: '',
    description: '',
    price: '',
    category: 'books',
    condition: 'good',
    images: [],
    contactInfo: ''
  });
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [priceRange, setPriceRange] = useState({ min: 0, max: 10000 });
  
  // Other existing state variables
  const [academicEvents, setAcademicEvents] = useState([]);
  const [knowledgeExchange, setKnowledgeExchange] = useState([]);
  const [contextualFeed, setContextualFeed] = useState('marketplace'); // Changed default to marketplace
  
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
      const combinedContent = [...posts, ...polls.map(poll => ({ ...poll, isPoll: true }))];
      
      // Apply filtering based on current feed mode
      const filteredContent = filterContentByMode(combinedContent);
      
      if (!initialLoadComplete) {
        setShuffledContent(shuffle(filteredContent));
        setInitialLoadComplete(true);
      } else {
        // When feed mode changes, re-filter and update content
        const updatedContent = shuffledContent.map(item => {
          if (item.isPoll) {
            const updatedPoll = polls.find(poll => poll.id === item.id);
            return updatedPoll ? { ...updatedPoll, isPoll: true } : item;
          } else {
            const updatedPost = posts.find(post => post.id === item.id);
            return updatedPost || item;
          }
        });
        
        // Re-filter based on current mode
        const filteredUpdatedContent = filterContentByMode([...posts, ...polls.map(poll => ({ ...poll, isPoll: true }))]);
        setShuffledContent(filteredUpdatedContent);
      }
    }
  }, [posts, polls, feedMode, userCollege, initialLoadComplete]);

  // Add a separate useEffect to handle feed mode changes
  useEffect(() => {
    // When feed mode changes, immediately re-filter content
    if (initialLoadComplete && (posts.length > 0 || polls.length > 0)) {
      const combinedContent = [...posts, ...polls.map(poll => ({ ...poll, isPoll: true }))];
      const filteredContent = filterContentByMode(combinedContent);
      setShuffledContent(filteredContent);
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

  // College Badge Component (SINGLE VERSION - REMOVE THE DUPLICATE)
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

  // REMOVE THIS DUPLICATE DECLARATION:
  // const CollegeBadge = ({ college, isUserCollege = false }) => {
  //   if (!college) return null;
  //   
  //   return (
  //     <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
  //       isUserCollege 
  //         ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
  //         : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
  //     }`}>
  //       <FiUsers className="w-3 h-3 mr-1" />
  //       {college}
  //     </div>
  //   );
  // };

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
        legend: {  // Fixed: Added colon after 'legend'
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
            color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
          },
          ticks: {
            color: isDarkMode ? '#9CA3AF' : '#374151',
          },
        },
        x: {
          grid: {
            display: false,
          },
          ticks: {
            color: isDarkMode ? '#9CA3AF' : '#374151',
          },
        },
      },
    };

    const { userDetails = { fullName: "Unknown", username: "unknown", avatar: "", college: null } } = poll;

    return (
      <div className="bg-white dark:bg-black rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden mb-6 hover:shadow-md dark:hover:shadow-xl transition-shadow duration-300">
        {/* Poll Header - Simplified */}
        <div className="flex items-center justify-between p-6 pb-4">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <div className="relative flex-shrink-0">
              <img
                src={userDetails.avatar || "/default-avatar.png"}
                alt="Avatar"
                className="w-12 h-12 rounded-full object-cover ring-2 ring-blue-100 dark:ring-blue-900"
              />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white dark:border-black"></div>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-gray-900 dark:text-white text-sm truncate">{userDetails.fullName}</h4>
              <div className="flex items-center space-x-2">
                <p className="text-gray-500 dark:text-gray-400 text-xs truncate">@{userDetails.username} • 2h ago</p>
                {/* Removed CollegeBadge component */}
              </div>
            </div>
          </div>
          <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors duration-200 flex-shrink-0">
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

  // INNOVATIVE FEATURE 1: Smart Study Groups & Academic Collaboration
  const StudyGroupCard = ({ group }) => (
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-2xl p-6 border border-purple-200 dark:border-purple-800 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
            <FiBook className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">{group.subject}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{group.members.length} members studying</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs font-medium">
            {group.difficulty}
          </span>
          <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors">
            Join Study Session
          </button>
        </div>
      </div>
      <p className="text-gray-700 dark:text-gray-300 mb-4">{group.description}</p>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
          <span className="flex items-center space-x-1">
            <FiClock className="w-4 h-4" />
            <span>Next session: {group.nextSession}</span>
          </span>
          <span className="flex items-center space-x-1">
            <FiTarget className="w-4 h-4" />
            <span>Goal: {group.goal}</span>
          </span>
        </div>
        <div className="flex -space-x-2">
          {group.members.slice(0, 3).map((member, idx) => (
            <img key={idx} src={member.avatar} alt="" className="w-8 h-8 rounded-full border-2 border-white dark:border-black" />
          ))}
          {group.members.length > 3 && (
            <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-700 border-2 border-white dark:border-black flex items-center justify-center text-xs font-medium">
              +{group.members.length - 3}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // INNOVATIVE FEATURE 2: Knowledge Exchange & Skill Swap
  const KnowledgeExchangeCard = ({ exchange }) => (
    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-2xl p-6 border border-emerald-200 dark:border-emerald-800 mb-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <img src={exchange.userAvatar} alt="" className="w-10 h-10 rounded-full" />
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white">{exchange.userName}</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">{exchange.userCollege}</p>
          </div>
        </div>
        <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full text-xs font-medium">
          Skill Swap
        </span>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center p-3 bg-white dark:bg-black rounded-lg border border-emerald-200 dark:border-emerald-800">
          <FiCpu  className="w-6 h-6 mx-auto mb-2 text-emerald-600" />
          <p className="font-medium text-gray-900 dark:text-white">Teaching</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">{exchange.teaching}</p>
        </div>
        <div className="text-center p-3 bg-white dark:bg-black rounded-lg border border-emerald-200 dark:border-emerald-800">
          <FiTarget className="w-6 h-6 mx-auto mb-2 text-blue-600" />
          <p className="font-medium text-gray-900 dark:text-white">Learning</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">{exchange.learning}</p>
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400">
            <FiStar className="w-4 h-4" />
            <span>{exchange.rating}/5.0</span>
          </span>
          <span className="text-sm text-gray-600 dark:text-gray-400">{exchange.completedExchanges} exchanges</span>
        </div>
        <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors">
          Connect
        </button>
      </div>
    </div>
  );

  // INNOVATIVE FEATURE 3: Time-Based Contextual Feed
  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 6) return { greeting: "Late night study session? 🌙", mood: "focus", color: "indigo" };
    if (hour < 12) return { greeting: "Good morning, scholar! ☀️", mood: "energetic", color: "yellow" };
    if (hour < 17) return { greeting: "Afternoon learning time! 📚", mood: "productive", color: "blue" };
    if (hour < 21) return { greeting: "Evening wind-down 🌅", mood: "social", color: "orange" };
    return { greeting: "Night owl mode activated 🦉", mood: "calm", color: "purple" };
  };

  // INNOVATIVE FEATURE 4: Study Mood & Learning Analytics
  const StudyMoodSelector = () => {
    const moods = [
      { emoji: "🎯", label: "Focused", value: "focused" },
      { emoji: "⚡", label: "Energetic", value: "energetic" },
      { emoji: "🤝", label: "Collaborative", value: "collaborative" },
      { emoji: "💡", label: "Creative", value: "creative" },
      { emoji: "😴", label: "Tired", value: "tired" },
    ];

    return (
      <div className="bg-white dark:bg-black rounded-2xl p-6 border border-gray-200 dark:border-gray-800 mb-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
          <FiZap className="w-5 h-5" />
          <span>How are you feeling today?</span>
        </h3>
        <div className="flex space-x-3">
          {moods.map((mood) => (
            <button
              key={mood.value}
              onClick={() => setStudyMood(mood.value)}
              className={`flex flex-col items-center p-3 rounded-lg transition-all ${
                studyMood === mood.value
                  ? 'bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-500'
                  : 'bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700'
              }`}
            >
              <span className="text-2xl mb-1">{mood.emoji}</span>
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{mood.label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  };

  // INNOVATIVE FEATURE 5: Learning Streak & Gamification
  const LearningStreakCard = () => (
    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-2xl p-6 border border-yellow-200 dark:border-yellow-800 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
            <FiAward className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white">Learning Streak</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Keep the momentum going!</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">{learningStreak}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            days
          </div>
        </div>
      </div>
      
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-600 dark:text-gray-400">Weekly Progress</span>
          <span className="font-medium text-gray-900 dark:text-white">6/7 days</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 h-2 rounded-full" style={{ width: '86%' }}></div>
        </div>
      </div>
      
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600 dark:text-gray-400">Next milestone: 10 days</span>
        <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-full text-xs">
          🎯 Almost there!
        </span>
      </div>
    </div>
  );

  // INNOVATIVE FEATURE 6: Smart Academic Events
  const AcademicEventCard = ({ event }) => (
    <div className="bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20 rounded-2xl p-6 border border-rose-200 dark:border-rose-800 mb-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-rose-500 rounded-full flex items-center justify-center">
            <FiCalendar className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">{event.title}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{event.organizer}</p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
          event.type === 'workshop' 
            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
            : event.type === 'seminar'
            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
            : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
        }`}>
          {event.type}
        </span>
      </div>
      
      <p className="text-gray-700 dark:text-gray-300 mb-4">{event.description}</p>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
          <span>{event.date}</span>
          <span>{event.time}</span>
          <span>{event.attending} attending</span>
        </div>
        <div className="flex space-x-2">
          <button className="px-3 py-1 border border-rose-300 dark:border-rose-700 text-rose-600 dark:text-rose-400 rounded-lg text-sm hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors">
            Remind Me
          </button>
          <button className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-medium transition-colors">
            Join Event
          </button>
        </div>
      </div>
    </div>
  );

  // INNOVATIVE FEATURE 7: Contextual Feed Tabs
  const ContextualFeedTabs = () => {
    const tabs = [
      { id: 'marketplace', label: 'Marketplace', icon: FiShoppingBag, color: 'blue' },
      { id: 'social', label: 'Social', icon: FiUsers, color: 'green' },
      { id: 'career', label: 'Career', icon: FiTrendingUp, color: 'purple' },
      { id: 'events', label: 'Events', icon: FiCalendar, color: 'rose' },
    ];

    return (
      <div className="flex space-x-1 mb-6 bg-gray-100 dark:bg-gray-900 rounded-full p-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setContextualFeed(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-full font-medium transition-all ${
                contextualFeed === tab.id
                  ? `bg-${tab.color}-600 text-white shadow-lg`
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-sm">{tab.label}</span>
            </button>
          );
        })}
      </div>
    );
  };

  // Enhanced render method with marketplace content
  const renderContextualContent = () => {
    // Helper function to render a single post (existing code)
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
          
          {/* Media Content - Fixed Video Player */}
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
          </div
          >
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
                <CommentThread 
                  key={comment.id} 
                  comment={comment} 
                  postId={post.id} 
                />
              ))}
            </div>
          </div>
        )}
      </div>
    );

    const filteredMarketplaceItems = marketplaceItems.filter(item => {
      if (selectedCategory === 'all') return true;
      return item.category === selectedCategory;
    }).filter(item => {
      if (feedMode === 'college' && userCollege) {
        return item.sellerDetails?.college === userCollege;
      }
      return true;
    });

    const contextualContent = {
      marketplace: [
        <MarketplaceFilters key="marketplace-filters" />,
        ...filteredMarketplaceItems.map(item => (
          <MarketplaceItemCard key={`marketplace-${item.id}`} item={item} />
        ))
      ],
      social: [
        // Render social posts (non-academic, non-poll content)
        ...shuffledContent
          .filter(item => !item.isPoll && item.category !== 'academic' && !item.tags?.includes('career'))
          .map(item => renderPost(item))
      ],
      career: [
        // Render career-related posts
        ...shuffledContent
          .filter(item => item.tags?.includes('career') || item.tags?.includes('internship'))
          .map(item => {
            if (item.isPoll) {
              return <Poll key={`poll-${item.id}`} poll={item} onVote={handleVote} />;
            }
            return renderPost(item);
          })
      ],
      events: [
        ...academicEvents.map(event => <AcademicEventCard key={`event-${event.id}`} event={event} />),
        // Render event-related posts
        ...shuffledContent
          .filter(item => item.tags?.includes('event'))
          .map(item => {
            if (item.isPoll) {
              return <Poll key={`poll-${item.id}`} poll={item} onVote={handleVote} />;
            }
            return renderPost(item);
          })
      ],
    };

    // If no specific content for the current tab, show all content
    const currentContent = contextualContent[contextualFeed];
    if (!currentContent || currentContent.length === 0) {
      return shuffledContent.map(item => {
        if (item.isPoll) {
          return <Poll key={`poll-${item.id}`} poll={item} onVote={handleVote} />;
        }
        return renderPost(item);
      });
    }

    return currentContent;
  };

  // Fetch marketplace items from Firebase
  useEffect(() => {
    const fetchMarketplaceItems = () => {
      const itemsRef = ref(db, 'marketplace');
      onValue(itemsRef, async (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const itemsArray = await Promise.all(
            Object.entries(data).map(async ([id, item]) => {
              if (!item.sellerId) {
                console.warn('Marketplace item missing sellerId:', id, item);
                return null;
              }
              
              const sellerDetails = await fetchUserDetails(item.sellerId);
              return {
                id,
                ...item,
                sellerDetails,
              };
            })
          );
          setMarketplaceItems(itemsArray.filter(item => item !== null));
        } else {
          setMarketplaceItems([]);
        }
      });
    };

    fetchMarketplaceItems();
  }, []);

  // Add new marketplace item
  const handleAddMarketplaceItem = async () => {
    if (!user) {
      alert("You must be logged in to sell items.");
      return;
    }

    if (!newItem.title || !newItem.price || !newItem.description) {
      alert("Please fill in all required fields.");
      return;
    }

    const itemsRef = ref(db, 'marketplace');
    const itemData = {
      ...newItem,
      sellerId: user.uid,
      createdAt: serverTimestamp(),
      status: 'available', // available, sold, reserved
      views: 0,
      favorites: {}
    };

    try {
      await push(itemsRef, itemData);
      setNewItem({
        title: '',
        description: '',
        price: '',
        category: 'books',
        condition: 'good',
        images: [],
        contactInfo: ''
      });
      setShowAddItemModal(false);
      alert("Item added successfully!");
    } catch (error) {
      console.error("Failed to add item:", error);
      alert("Failed to add item. Please try again.");
    }
  };

  // Mark item as sold
  const handleMarkAsSold = async (itemId) => {
    if (!user) return;
    
    const itemRef = ref(db, `marketplace/${itemId}`);
    try {
      await update(itemRef, { status: 'sold' });
    } catch (error) {
      console.error("Failed to mark as sold:", error);
    }
  };

  // Delete marketplace item
  const handleDeleteItem = async (itemId, sellerId) => {
    if (!user || user.uid !== sellerId) {
      alert("You can only delete your own items.");
      return;
    }

    if (window.confirm("Are you sure you want to delete this item?")) {
      const itemRef = ref(db, `marketplace/${itemId}`);
      try {
        await remove(itemRef);
      } catch (error) {
        console.error("Failed to delete item:", error);
      }
    }
  };

  // Add to favorites
  const handleToggleFavorite = async (itemId) => {
    if (!user) {
      alert("You must be logged in to favorite items.");
      return;
    }

    const favRef = ref(db, `marketplace/${itemId}/favorites/${user.uid}`);
    const snapshot = await get(favRef);
    
    try {
      if (snapshot.exists()) {
        await update(ref(db, `marketplace/${itemId}/favorites`), { [user.uid]: null });
      } else {
        await update(ref(db, `marketplace/${itemId}/favorites`), { [user.uid]: true });
      }
    } catch (error) {
      console.error("Failed to update favorites:", error);
    }
  };

  // Increment view count
  const handleViewItem = async (itemId) => {
    const viewRef = ref(db, `marketplace/${itemId}/views`);
    const snapshot = await get(viewRef);
    const currentViews = snapshot.val() || 0;
    
    try {
      await update(ref(db, `marketplace/${itemId}`), { views: currentViews + 1 });
    } catch (error) {
      console.error("Failed to update views:", error);
    }
  };

  // Marketplace Item Card Component
  const MarketplaceItemCard = ({ item }) => {
    const condition = productConditions.find(c => c.value === item.condition);
    const isOwner = user?.uid === item.sellerId;
    const isFavorited = item.favorites?.[user?.uid];

    return (
      <div className="bg-white dark:bg-black rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden mb-6 hover:shadow-lg dark:hover:shadow-xl transition-all duration-300">
        {/* Item Header */}
        <div className="flex items-center justify-between p-6 pb-4">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <img
              src={item.sellerDetails?.avatar || "/default-avatar.png"}
              alt="Seller Avatar"
              className="w-10 h-10 rounded-full object-cover ring-2 ring-blue-100 dark:ring-blue-900"
            />
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                {item.sellerDetails?.fullName || "Unknown Seller"}
              </h4>
              <div className="flex items-center space-x-2">
                <p className="text-gray-500 dark:text-gray-400 text-xs truncate">
                  @{item.sellerDetails?.username || "unknown"} • 
                  {item.sellerDetails?.college && (
                    <span className="ml-1">{item.sellerDetails.college}</span>
                  )}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium bg-${condition?.color}-100 dark:bg-${condition?.color}-900/30 text-${condition?.color}-700 dark:text-${condition?.color}-300`}>
              {condition?.label}
            </span>
            {isOwner && (
              <div className="flex space-x-1">
                <button
                  onClick={() => handleDeleteItem(item.id, item.sellerId)}
                  className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                >
                  <FiTrash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Item Content */}
        <div className="px-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{item.title}</h3>
              <p className="text-gray-700 dark:text-gray-300 text-sm mb-3">{item.description}</p>
              
              <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
                <span className="flex items-center space-x-1">
                  <FiTag className="w-4 h-4" />
                  <span className="capitalize">{item.category}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <FiEye className="w-4 h-4" />
                  <span>{item.views || 0} views</span>
                </span>
                {item.status === 'sold' && (
                  <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full text-xs font-medium">
                    SOLD
                  </span>
                )}
              </div>
            </div>
            
            <div className="text-right ml-4">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                ₹{parseFloat(item.price).toLocaleString()}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {new Date(item.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>

          {/* Item Images */}
          {item.images && item.images.length > 0 && (
            <div className="mb-4 rounded-xl overflow-hidden">
              <img 
                src={item.images[0]} 
                alt={item.title}
                className="w-full h-48 object-cover cursor-pointer"
                onClick={() => handleViewItem(item.id)}
              />
            </div>
          )}
        </div>

        {/* Item Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => handleToggleFavorite(item.id)}
              className={`flex items-center space-x-2 transition-colors duration-200 ${
                isFavorited
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400'
              }`}
            >
              <FiHeart className={`w-5 h-5 ${isFavorited ? 'fill-current' : ''}`} />
              <span className="text-sm font-medium">
                {Object.keys(item.favorites || {}).length}
              </span>
            </button>
            
            <button className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200">
              <FiMessageCircle className="w-5 h-5" />
              <span className="text-sm font-medium">Contact</span>
            </button>
            
            <button className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors duration-200">
              <FiShare className="w-5 h-5" />
              <span className="text-sm font-medium">Share</span>
            </button>
          </div
          >
          {isOwner && item.status === 'available' && (
            <button
              onClick={() => handleMarkAsSold(item.id)}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
            >
              Mark as Sold
            </button>
          )}
        </div>
      </div>
    );
  };

  // Add Item Modal Component
  const AddItemModal = () => {
    if (!showAddItemModal) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-black rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Sell Your Item</h2>
              <button
                onClick={() => setShowAddItemModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              >
                <FiMoreHorizontal className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Item Title *
                </label>
                <input
                  type="text"
                  value={newItem.title}
                  onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                  className="w-full p-3 border border-gray-200 dark:border-gray-800 bg-white dark:bg-black text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter item title..."
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description *
                </label>
                <textarea
                  value={newItem.description}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                  rows="4"
                  className="w-full p-3 border border-gray-200 dark:border-gray-800 bg-white dark:bg-black text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Describe your item..."
                />
              </div>

              {/* Price and Category */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Price (₹) *
                  </label>
                  <input
                    type="number"
                    value={newItem.price}
                    onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                    className="w-full p-3 border border-gray-200 dark:border-gray-800 bg-white dark:bg-black text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category
                  </label>
                  <select
                    value={newItem.category}
                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                    className="w-full p-3 border border-gray-200 dark:border-gray-800 bg-white dark:bg-black text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {marketplaceCategories.slice(1).map(category => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Condition */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Condition
                </label>
                <div className="flex flex-wrap gap-2">
                  {productConditions.map(condition => (
                    <button
                      key={condition.value}
                      onClick={() => setNewItem({ ...newItem, condition: condition.value })}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        newItem.condition === condition.value
                          ? `bg-${condition.color}-100 dark:bg-${condition.color}-900/30 text-${condition.color}-700 dark:text-${condition.color}-300 border-2 border-${condition.color}-500`
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      {condition.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Contact Info */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Contact Information
                </label>
                <input
                  type="text"
                  value={newItem.contactInfo}
                  onChange={(e) => setNewItem({ ...newItem, contactInfo: e.target.value })}
                  className="w-full p-3 border border-gray-200 dark:border-gray-800 bg-white dark:bg-black text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Phone number, email, or other contact details..."
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
              <button
                onClick={() => setShowAddItemModal(false)}
                className="px-6 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddMarketplaceItem}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
              >
                List Item
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Marketplace Filters Component
  const MarketplaceFilters = () => (
    <div className="bg-white dark:bg-black rounded-2xl p-6 border border-gray-200 dark:border-gray-800 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
          <FiShoppingBag className="w-5 h-5" />
          <span>Marketplace</span>
        </h3>
        <button
          onClick={() => setShowAddItemModal(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
        >
          <FiShoppingBag className="w-4 h-4" />
          <span>Sell Item</span>
        </button>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 mb-4">
        {marketplaceCategories.map(category => {
          const Icon = category.icon;
          return (
            <button
              key={category.value}
              onClick={() => setSelectedCategory(category.value)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedCategory === category.value
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-2 border-blue-500'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{category.label}</span>
            </button>
          );
        })}
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
        <span>
          {marketplaceItems.filter(item => 
            selectedCategory === 'all' || item.category === selectedCategory
          ).length} items available
        </span>
        <span>
          {marketplaceItems.filter(item => item.status === 'available').length} active listings
        </span>
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 bg-gray-50 dark:bg-black min-h-screen transition-colors duration-300">
      {/* Time-based greeting */}
      <div className={`bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-2xl p-4 mb-6 border border-blue-200 dark:border-blue-800`}>
        <p className="text-center font-medium text-gray-900 dark:text-white">
          🛒 Welcome to the Student Marketplace! Buy and sell with your peers.
        </p>
      </div>

      {/* Contextual Feed Tabs */}
      <ContextualFeedTabs />

      {/* Feed Mode Toggle - Enhanced */}
      <FeedModeToggle />
      
      <div className="space-y-6">
        {renderContextualContent()}
      </div>

      {/* Add Item Modal */}
      <AddItemModal />
    </div>
  );
};

export default Feeds;