import React, { useState, useEffect, useRef } from 'react';
import { FaHeart, FaComment, FaShare, FaVolumeUp, FaVolumeMute, FaCamera, FaPlus, FaTimes, FaReply, FaEllipsisV } from 'react-icons/fa';
import { getDatabase, ref, onValue, set, update, remove, push, get } from 'firebase/database';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import BottomBar from './BottomBar';
import { Link } from 'react-router-dom';

const Hivees = () => {
  const [hivees, setHivees] = useState([]);
  const [isMuted, setIsMuted] = useState(true);
  const [likedPosts, setLikedPosts] = useState({});
  const [comments, setComments] = useState({});
  const [commentText, setCommentText] = useState('');
  const [replyText, setReplyText] = useState('');
  const [showComments, setShowComments] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [likeCounts, setLikeCounts] = useState({});
  const [activeReply, setActiveReply] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [likeAnimation, setLikeAnimation] = useState({});

  const containerRef = useRef(null);

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

  const shuffleArray = (array) => array.sort(() => Math.random() - 0.5);

  // Fetch current user data
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUserId(user.uid);
        
        // Fetch user details from Firestore
        const firestore = getFirestore();
        const userRef = doc(firestore, 'users', user.uid);
        const userSnapshot = await getDoc(userRef);
        const userData = userSnapshot.data();
        setCurrentUser(userData);
      } else {
        setCurrentUserId(null);
        setCurrentUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // Fetch like counts and user's liked posts
  useEffect(() => {
    if (!currentUserId) return;

    const db = getDatabase();
    const hiveesRef = ref(db, 'hivees');
    
    onValue(hiveesRef, (snapshot) => {
      const data = snapshot.val();
      const likeCounts = {};
      const userLikes = {};
      
      for (const postId in data) {
        likeCounts[postId] = data[postId].likes || 0;
        
        // Check if current user liked this post
        if (data[postId].userLikes && data[postId].userLikes[currentUserId]) {
          userLikes[postId] = true;
        }
      }
      
      setLikeCounts(likeCounts);
      setLikedPosts(userLikes);
    });
  }, [currentUserId]);

  // Handle post like/unlike with animation
  const handleLike = async (postId, currentLikes) => {
    if (!currentUserId) return;

    const db = getDatabase();
    const userLikeRef = ref(db, `hivees/${postId}/userLikes/${currentUserId}`);
    const likesRef = ref(db, `hivees/${postId}/likes`);

    const snapshot = await get(userLikeRef);
    const userHasLiked = snapshot.exists();

    // Trigger animation
    setLikeAnimation(prev => ({ ...prev, [postId]: true }));
    setTimeout(() => {
      setLikeAnimation(prev => ({ ...prev, [postId]: false }));
    }, 1000);

    if (userHasLiked) {
      await remove(userLikeRef);
      const newLikesCount = Math.max(0, currentLikes - 1);
      await set(likesRef, newLikesCount);

      setLikedPosts((prev) => ({
        ...prev,
        [postId]: false,
      }));
    } else {
      await set(userLikeRef, true);
      const newLikesCount = currentLikes + 1;
      await set(likesRef, newLikesCount);

      setLikedPosts((prev) => ({
        ...prev,
        [postId]: true,
      }));
    }
  };

  // Handle comment submit
  const handleCommentSubmit = async (postId) => {
    if (!commentText.trim() || !currentUserId) return;

    const db = getDatabase();
    const commentRef = ref(db, `hivees/${postId}/comments`);

    await push(commentRef, {
      text: commentText,
      userId: currentUserId,
      createdAt: Date.now(),
      replies: {}
    });

    setCommentText('');
    fetchComments(postId);
  };

  // Handle reply submit
  const handleReplySubmit = async (postId, commentId) => {
    if (!replyText.trim() || !currentUserId) return;

    const db = getDatabase();
    const replyRef = ref(db, `hivees/${postId}/comments/${commentId}/replies`);

    await push(replyRef, {
      text: replyText,
      userId: currentUserId,
      createdAt: Date.now()
    });

    setReplyText('');
    setActiveReply(null);
    fetchComments(postId);
  };

  // Fetch comments for a specific post
  const fetchComments = async (postId) => {
    const db = getDatabase();
    const commentRef = ref(db, `hivees/${postId}/comments`);
    const firestore = getFirestore();

    onValue(commentRef, async (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const commentArray = await Promise.all(
          Object.entries(data).map(async ([id, comment]) => {
            // Fetch user details from Firestore
            const userRef = doc(firestore, 'users', comment.userId);
            const userSnapshot = await getDoc(userRef);
            const userData = userSnapshot.data();

            // Fetch replies if they exist
            let replies = [];
            if (comment.replies) {
              replies = await Promise.all(
                Object.entries(comment.replies).map(async ([replyId, reply]) => {
                  const replyUserRef = doc(firestore, 'users', reply.userId);
                  const replyUserSnapshot = await getDoc(replyUserRef);
                  const replyUserData = replyUserSnapshot.data();

                  return {
                    id: replyId,
                    ...reply,
                    username: replyUserData?.username,
                    avatar: replyUserData?.avatar,
                    fullName: replyUserData?.fullName
                  };
                })
              );
            }

            return {
              id,
              ...comment,
              username: userData?.username,
              avatar: userData?.avatar,
              fullName: userData?.fullName,
              replies: replies.sort((a, b) => a.createdAt - b.createdAt)
            };
          })
        );
        setComments(prev => ({
          ...prev,
          [postId]: commentArray.sort((a, b) => b.createdAt - a.createdAt)
        }));
      } else {
        setComments(prev => ({
          ...prev,
          [postId]: []
        }));
      }
    });
  };

  // Handle video playback
  const handleVideoPlayback = () => {
    const videos = containerRef.current?.querySelectorAll('video');
    if (!videos) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = entry.target;
          if (entry.isIntersecting) {
            video.muted = isMuted;
            video.play().catch((err) => console.log("Video play error:", err));
          } else {
            video.pause();
          }
        });
      },
      { threshold: 0.5 }
    );

    videos.forEach((video) => observer.observe(video));

    return () => observer.disconnect();
  };

  useEffect(() => {
    const fetchHivees = async () => {
      const db = getDatabase();
      const firestore = getFirestore();
      const hiveesRef = ref(db, 'hivees');
      
      onValue(hiveesRef, async (snapshot) => {
        const hiveesData = snapshot.val();
        const hiveesArray = [];

        for (const key in hiveesData) {
          const hivee = hiveesData[key];
          if (hivee.userId) {
            const userRef = doc(firestore, 'users', hivee.userId);
            const userSnapshot = await getDoc(userRef);
            const userData = userSnapshot.data();

            hiveesArray.push({
              ...hivee,
              id: key,
              avatar: userData?.avatar || '',
              username: userData?.username || '',
              fullName: userData?.fullName || '',
              likes: hivee.likes || 0,
              commentCount: hivee.comments ? Object.keys(hivee.comments).length : 0,
              shares: hivee.shares || 0,
            });
          }
        }

        setHivees(shuffleArray(hiveesArray));
      });
    };

    fetchHivees();
  }, []);

  useEffect(() => {
    handleVideoPlayback();
  }, [hivees, isMuted]);

  const handleDoubleClick = (postId, currentLikes) => {
    handleLike(postId, currentLikes);
  };

  const handleShare = async (postId) => {
    try {
      await navigator.clipboard.writeText(`https://hiihive.vercel.app/hivee/${postId}`);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d`;
    if (hours > 0) return `${hours}h`;
    if (minutes > 0) return `${minutes}m`;
    return `${seconds}s`;
  };

  const LikeButton = ({ postId, likesCount }) => {
    const isLiked = likedPosts[postId];
    const showAnimation = likeAnimation[postId];
  
    return (
      <div className="flex flex-col items-center">
        <button
          onClick={() => handleLike(postId, likesCount)}
          className={`relative p-3 rounded-full transition-all duration-300 ${
            isLiked ? 'bg-red-500/20' : 'bg-black/30'
          }`}
        >
          <FaHeart 
            className={`text-2xl transition-all duration-300 ${
              isLiked ? 'text-red-500 scale-110' : 'text-white'
            } ${showAnimation ? 'animate-bounce scale-125' : ''}`} 
          />
          {showAnimation && (
            <div className="absolute inset-0 flex items-center justify-center">
              <FaHeart className="text-red-500 text-4xl animate-ping" />
            </div>
          )}
        </button>
        <span className="text-white text-sm font-medium mt-1">
          {likesCount > 0 ? likesCount : ''}
        </span>
      </div>
    );
  };

  const CommentModal = ({ postId }) => {
    const postComments = comments[postId] || [];

    return (
      <div className="fixed inset-0 bg-black/90 z-50 flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h2 className="text-white text-xl font-semibold">Comments</h2>
          <button 
            onClick={() => setShowComments(null)}
            className="p-2 rounded-full hover:bg-gray-800 transition-colors"
          >
            <FaTimes className="text-white text-xl" />
          </button>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {postComments.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              <FaComment className="text-4xl mx-auto mb-4 opacity-50" />
              <p>No comments yet. Be the first to comment!</p>
            </div>
          ) : (
            postComments.map((comment) => (
              <div key={comment.id} className="space-y-3">
                {/* Main Comment */}
                <div className="flex items-start space-x-3">
                  <img 
                    src={comment.avatar || '/default-avatar.png'} 
                    alt="Avatar" 
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <div className="bg-gray-800 rounded-2xl px-4 py-3">
                      <div className="flex items-center space-x-2 mb-1">
                        <p className="text-white font-semibold text-sm">{comment.username}</p>
                        <span className="text-gray-400 text-xs">{formatTimeAgo(comment.createdAt)}</span>
                      </div>
                      <p className="text-white text-sm">{comment.text}</p>
                    </div>
                    <button
                      onClick={() => setActiveReply(activeReply === comment.id ? null : comment.id)}
                      className="text-gray-400 text-xs mt-2 hover:text-white transition-colors flex items-center space-x-1"
                    >
                      <FaReply />
                      <span>Reply</span>
                    </button>
                  </div>
                </div>

                {/* Replies */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="ml-13 space-y-3">
                    {comment.replies.map((reply) => (
                      <div key={reply.id} className="flex items-start space-x-3">
                        <img 
                          src={reply.avatar || '/default-avatar.png'} 
                          alt="Avatar" 
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <div className="flex-1">
                          <div className="bg-gray-700 rounded-2xl px-4 py-3">
                            <div className="flex items-center space-x-2 mb-1">
                              <p className="text-white font-semibold text-sm">{reply.username}</p>
                              <span className="text-gray-400 text-xs">{formatTimeAgo(reply.createdAt)}</span>
                            </div>
                            <p className="text-white text-sm">{reply.text}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Reply Input */}
                {activeReply === comment.id && (
                  <div className="ml-13 flex items-center space-x-3">
                    <img 
                      src={currentUser?.avatar || '/default-avatar.png'} 
                      alt="Your Avatar" 
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <div className="flex-1 flex items-center space-x-2">
                      <input
                        type="text"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Write a reply..."
                        className="flex-1 bg-gray-800 text-white rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleReplySubmit(postId, comment.id);
                          }
                        }}
                      />
                      <button
                        onClick={() => handleReplySubmit(postId, comment.id)}
                        disabled={!replyText.trim()}
                        className="text-blue-500 font-semibold text-sm disabled:text-gray-500 hover:text-blue-400 transition-colors"
                      >
                        Send
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Comment Input */}
        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center space-x-3">
            <img 
              src={currentUser?.avatar || '/default-avatar.png'} 
              alt="Your Avatar" 
              className="w-10 h-10 rounded-full object-cover"
            />
            <div className="flex-1 flex items-center space-x-3">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 bg-gray-800 text-white rounded-full px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleCommentSubmit(postId);
                  }
                }}
              />
              <button
                onClick={() => handleCommentSubmit(postId)}
                disabled={!commentText.trim()}
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 text-white px-6 py-3 rounded-full font-semibold transition-colors"
              >
                Post
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      {/* Header */}
      <div className="absolute top-0 left-0 w-full flex justify-between items-center p-5 z-20 bg-gradient-to-b from-black/70 to-transparent">
        <div className="text-white text-2xl font-bold">Hivees</div>
        <div className="flex items-center gap-4">
          <Link to="/upload" className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors">
            <FaCamera className="text-white text-xl" />
          </Link>
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            {isMuted ? 
              <FaVolumeMute className="text-white text-xl" /> : 
              <FaVolumeUp className="text-white text-xl" />
            }
          </button>
        </div>
      </div>

      {/* Videos Container */}
      <div ref={containerRef} className="h-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide">
        {hivees.map((hivee, index) => (
          <div 
            key={hivee.id} 
            className="w-full h-screen snap-start relative group"
            onDoubleClick={() => handleDoubleClick(hivee.id, likeCounts[hivee.id] || 0)}
          >
            {/* Video */}
            <video 
              className="w-full h-full object-cover" 
              muted 
              loop 
              src={hivee.fileUrl}
              playsInline
            />

            {/* Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-transparent pointer-events-none" />

            {/* User Info */}
            <div className="absolute bottom-24 left-5 right-20 z-10">
              <div className="flex items-center space-x-3 mb-3">
                <Link to={`/user/${hivee.userId}`} className="flex-shrink-0">
                  <img 
                    src={hivee.avatar || '/default-avatar.png'} 
                    alt="User" 
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-white/50"
                  />
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <p className="text-white font-bold text-lg truncate">{hivee.username}</p>
                    <button className="bg-red-500 hover:bg-red-600 text-white text-sm px-3 py-1 rounded-full font-semibold transition-colors">
                      Follow
                    </button>
                  </div>
                  <p className="text-white/80 text-sm truncate">{hivee.fullName}</p>
                </div>
              </div>
              
              {hivee.caption && (
                <p className="text-white text-sm mb-2 leading-relaxed">
                  {hivee.caption}
                </p>
              )}
              
              {hivee.selectedMusic && (
                <div className="flex items-center space-x-2 text-white/80 text-sm">
                  <span>🎵</span>
                  <p className="truncate">{hivee.selectedMusic}</p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="absolute bottom-24 right-5 flex flex-col items-center space-y-6 z-10">
              <LikeButton postId={hivee.id} likesCount={likeCounts[hivee.id] || 0} />
              
              <div className="flex flex-col items-center">
                <button
                  onClick={() => {
                    setShowComments(hivee.id);
                    fetchComments(hivee.id);
                  }}
                  className="p-3 rounded-full bg-black/30 hover:bg-black/50 transition-all duration-300"
                >
                  <FaComment className="text-white text-2xl" />
                </button>
                <span className="text-white text-sm font-medium mt-1">
                  {hivee.commentCount > 0 ? hivee.commentCount : ''}
                </span>
              </div>

              <div className="flex flex-col items-center">
                <button
                  onClick={() => handleShare(hivee.id)}
                  className="p-3 rounded-full bg-black/30 hover:bg-black/50 transition-all duration-300"
                >
                  <FaShare className="text-white text-2xl" />
                </button>
                <span className="text-white text-sm font-medium mt-1">
                  {hivee.shares > 0 ? hivee.shares : ''}
                </span>
              </div>

              <button className="p-3 rounded-full bg-black/30 hover:bg-black/50 transition-all duration-300">
                <FaEllipsisV className="text-white text-xl" />
              </button>
            </div>

            {/* Double tap like animation */}
            {likeAnimation[hivee.id] && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                <FaHeart className="text-red-500 text-8xl animate-ping opacity-80" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Bottom Bar */}
      <BottomBar />

      {/* Comments Modal */}
      {showComments && <CommentModal postId={showComments} />}

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default Hivees;