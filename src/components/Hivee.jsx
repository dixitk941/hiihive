import React, { useState, useEffect, useRef } from 'react';
import { FaThumbsUp, FaComment, FaShare, FaVolumeUp, FaVolumeMute, FaCamera } from 'react-icons/fa';
import { getDatabase, ref, onValue, set, update, remove, push, get } from 'firebase/database';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth'; // Import Firebase Authentication
import BottomBar from './BottomBar';
import { Link } from 'react-router-dom'; // Import Link from React Router

const Hivees = () => {
  const [hivees, setHivees] = useState([]);
  const [isMuted, setIsMuted] = useState(true);
  const [likedPosts, setLikedPosts] = useState({});
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [showComments, setShowComments] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null); // Initialize state for current user ID
  const [likeCounts, setLikeCounts] = useState({}); // Initialize state for like counts

  const containerRef = useRef(null);

  const shuffleArray = (array) => array.sort(() => Math.random() - 0.5);

  // Fetch like counts from the database
  useEffect(() => {
    const db = getDatabase();
    const hiveesRef = ref(db, 'hivees');
    onValue(hiveesRef, (snapshot) => {
      const data = snapshot.val();
      const likeCounts = {};
      for (const postId in data) {
        likeCounts[postId] = data[postId].likes || 0;
      }
      setLikeCounts(likeCounts);
    });
  }, [hivees]);

  // Handle post like/unlike
  const handleLike = async (postId, currentLikes) => {
    const db = getDatabase();
    const postRef = ref(db, `hivees/${postId}/likes`);
    const userLikeRef = ref(db, `hivees/${postId}/userLikes/${currentUserId}`);

    const snapshot = await get(userLikeRef);
    const userHasLiked = snapshot.exists();

    if (userHasLiked) {
      await remove(userLikeRef);
      const newLikesCount = currentLikes - 1;
      if (!isNaN(newLikesCount)) {
        update(postRef, { count: newLikesCount });
      }

      setLikedPosts((prev) => ({
        ...prev,
        [postId]: false,
      }));

      setHivees((prevHivees) =>
        prevHivees.map((hivee) =>
          hivee.id === postId ? { ...hivee, likes: newLikesCount } : hivee
        )
      );
    } else {
      await set(userLikeRef, true);
      const newLikesCount = currentLikes + 1;
      if (!isNaN(newLikesCount)) {
        update(postRef, { count: newLikesCount });
      }

      setLikedPosts((prev) => ({
        ...prev,
        [postId]: true,
      }));

      setHivees((prevHivees) =>
        prevHivees.map((hivee) =>
          hivee.id === postId ? { ...hivee, likes: newLikesCount } : hivee
        )
      );
    }
  };

  // Handle comment submit
  const handleCommentSubmit = async (postId) => {
    if (!commentText.trim()) return;

    const db = getDatabase();
    const commentRef = ref(db, `hivees/${postId}/comments`);

    await push(commentRef, { 
      text: commentText, 
      userId: currentUserId, 
      createdAt: Date.now() 
    });

    setCommentText('');
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
            // Fetch user details from Firestore based on the userId
            const userRef = doc(firestore, 'users', comment.userId);
            const userSnapshot = await getDoc(userRef);
            const userData = userSnapshot.data();

            return { 
              id, 
              ...comment, 
              username: userData?.username, 
              avatar: userData?.avatar, 
              fullname: userData?.fullname 
            };
          })
        );
        setComments(commentArray);
      } else {
        setComments([]);
      }
    });
  };

  // Handle video playback
  const handleVideoPlayback = () => {
    const videos = containerRef.current.querySelectorAll('video');
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
    // Fetch the current user ID using Firebase Authentication
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUserId(user.uid); // Set the user ID in state
      } else {
        setCurrentUserId(null); // Handle unauthenticated state
      }
    });

    return () => unsubscribe(); // Cleanup listener on unmount
  }, []);

  useEffect(() => {
    const fetchHivees = async () => {
      const db = getDatabase();
      const firestore = getFirestore();
      const hiveesRef = ref(db, 'hivees');
      const hiveesSnapshot = await new Promise((resolve) => {
        onValue(hiveesRef, (snapshot) => {
          resolve(snapshot);
        });
      });

      const hiveesData = hiveesSnapshot.val();
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
            fullname: userData?.fullname || '',
            likes: hivee.likes || 0,
            comments: hivee.comments || [],
            shares: hivee.shares || 0,
          });
        }
      }

      setHivees(shuffleArray(hiveesArray));
    };

    fetchHivees();
  }, []);

  useEffect(() => {
    handleVideoPlayback();
  }, [hivees, isMuted]);

  const handleDoubleClick = (postId, currentLikes) => {
    handleLike(postId, currentLikes);
  };

  const LikeButton = ({ postId }) => {
    const isLiked = likedPosts[postId];
  
    return (
      <button
        onClick={() => handleLike(postId, hivees.find(hivee => hivee.id === postId).likes)}
        className="ml-3"
      >
        <FaThumbsUp className={isLiked ? 'text-red-500' : 'text-gray-500'} size={24} />
      </button>
    );
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
    <div className="absolute top-0 left-0 w-full flex justify-between items-center p-5 z-20">
      <div className="text-white text-2xl font-bold">Hivees</div>
      <div className="flex items-center gap-3 text-white text-2xl">
        <FaCamera />
        <button
          className="text-white text-2xl"
          onClick={() => setIsMuted(!isMuted)}
        >
          {isMuted ? <FaVolumeMute /> : <FaVolumeUp />}
        </button>
      </div>
    </div>
  
    <div ref={containerRef} className="h-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide pt-16">
      {hivees.map((hivee, index) => (
        <div 
          key={index} 
          className="w-full h-screen snap-start relative transition-transform duration-500 ease-in-out"
          onDoubleClick={() => handleDoubleClick(hivee.id, hivee.likes)}
        >
          <video className="w-full h-full object-contain" muted loop src={hivee.fileUrl} />
          <div className="absolute bottom-20 left-5 flex flex-col gap-3 z-10">
            <div className="flex items-center gap-2">
              <Link to={`/user/${hivee.userId}`}>
                <img src={hivee.avatar} alt="User" className="w-10 h-10 rounded-full" />
              </Link>
              <div className="text-white">
                <p className="font-bold">{hivee.username}</p>
                <p className="text-sm">{hivee.fullname}</p>
                <p className="text-sm">{hivee.caption}</p>
              </div>
            </div>
            <div className="text-white text-sm mt-2">
              <p>🎵 {hivee.selectedMusic}</p>
            </div>
          </div>
          <div className="absolute bottom-20 right-5 flex flex-col items-center gap-3 z-10">
            <LikeButton postId={hivee.id} />
            <button
              className="text-white text-2xl"
              onClick={() => setShowComments(hivee.id)}
            >
              <FaComment />
            </button>
            <p className="text-white text-sm">{hivee.comments.length}</p>
            <button
              className="text-white text-2xl"
              onClick={() => navigator.clipboard.writeText(`https://hiihive.vercel.app/hivee/${hivee.id}`)}
            >
              <FaShare />
            </button>
          </div>
        </div>
      ))}
    </div>
  
    {/* Bottom Bar */}
    <BottomBar />
  
    {showComments && (
      <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex flex-col p-5">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-white text-lg">Comments</h2>
          <button onClick={() => setShowComments(null)} className="text-white">Close</button>
        </div>
        <div className="overflow-y-scroll max-h-[300px]">
          {comments.map((comment) => (
            <div key={comment.id} className="flex items-start gap-3 mb-3">
              <img src={comment.avatar} alt="Avatar" className="w-8 h-8 rounded-full" />
              <div>
                <p className="text-white font-bold">{comment.username}</p>
                <p className="text-white">{comment.text}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-auto flex items-center gap-3">
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Add a comment"
            className="w-full p-2 bg-gray-800 text-white rounded-lg"
          />
          <button onClick={() => handleCommentSubmit(showComments)} className="ml-3 text-blue-500">Submit</button>
        </div>
      </div>
    )}
  </div>
    );
};

export default Hivees;
