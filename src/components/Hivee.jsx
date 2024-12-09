import React, { useState, useEffect, useRef } from 'react';
import { FaHeart, FaComment, FaShare, FaVolumeUp, FaCamera } from 'react-icons/fa';
import { getDatabase, ref, onValue } from 'firebase/database';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import BottomBar from './BottomBar';

const Hivees = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hivees, setHivees] = useState([]);
  const [videoQuality, setVideoQuality] = useState('high'); // Default to high quality
  const containerRef = useRef(null);

  const handleScroll = (event) => {
    const container = containerRef.current;
    const scrollTop = container.scrollTop;
    const containerHeight = container.clientHeight;
    const newIndex = Math.round(scrollTop / containerHeight);

    if (newIndex !== currentIndex) {
      setCurrentIndex(newIndex);
      preloadNextHivee(newIndex); // Preload the next hivee video
    }
  };

  const preloadNextHivee = (index) => {
    if (index + 1 < hivees.length) {
      const nextHivee = hivees[index + 1];
      // Preload the next video URL
      const videoElement = new Image();
      videoElement.src = nextHivee.fileUrl;
    }
  };

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
        const userDocRef = doc(firestore, `users/${hivee.userId}`);
        const userDoc = await getDoc(userDocRef);
        const userData = userDoc.exists() ? userDoc.data() : {};

        const likesRef = ref(db, `likes/${key}`);
        const commentsRef = ref(db, `comments/${key}`);
        const sharesRef = ref(db, `shares/${key}`);

        const likesSnapshot = await new Promise((resolve) => {
          onValue(likesRef, (snapshot) => {
            resolve(snapshot);
          });
        });

        const commentsSnapshot = await new Promise((resolve) => {
          onValue(commentsRef, (snapshot) => {
            resolve(snapshot);
          });
        });

        const sharesSnapshot = await new Promise((resolve) => {
          onValue(sharesRef, (snapshot) => {
            resolve(snapshot);
          });
        });

        const likes = likesSnapshot.val() || 0;
        const comments = commentsSnapshot.val() || [];
        const shares = sharesSnapshot.val() || 0;

        hiveesArray.push({
          ...hivee,
          id: key,
          avatar: userData.avatar || '',
          username: userData.username || '',
          fullname: userData.fullname || '',
          comments,
          likes,
          shares,
        });
      }

      setHivees(hiveesArray);
    };

    fetchHivees();
  }, []);

  useEffect(() => {
    // Check for internet speed and adjust video quality accordingly
    const updateVideoQuality = () => {
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      if (connection && connection.downlink) {
        const speed = connection.downlink; // in Mbps
        if (speed < 1) {
          setVideoQuality('low');
        } else if (speed < 3) {
          setVideoQuality('medium');
        } else {
          setVideoQuality('high');
        }
      }
    };

    updateVideoQuality();
    window.addEventListener('resize', updateVideoQuality);

    return () => {
      window.removeEventListener('resize', updateVideoQuality);
    };
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    container.addEventListener('scroll', handleScroll);

    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [currentIndex]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      <div className="absolute top-0 left-0 w-full flex justify-between items-center p-5 z-20">
        <div className="text-white text-2xl font-bold">Hivees</div>
        <div className="text-white text-2xl">
          <FaCamera />
        </div>
      </div>

      <div ref={containerRef} className="h-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide pt-16">
        {hivees.map((hivee, index) => (
          <div
            key={index}
            className="w-full h-screen snap-start relative transition-transform duration-500 ease-in-out"
          >
            <video className="w-full h-full object-contain" muted autoPlay loop>
              <source
                src={videoQuality === 'high' ? hivee.fileUrl : hivee.lowQualityFileUrl}
                type="video/mp4"
              />
              Your browser does not support the video tag.
            </video>

            <div className="absolute bottom-20 left-5 flex flex-col gap-3 z-10">
              <div className="flex items-center gap-2">
                <img src={hivee.avatar} alt="User" className="w-10 h-10 rounded-full" />
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
              <button className="text-white text-2xl"><FaHeart /></button>
              <p className="text-white text-sm">{hivee.likes}</p>
              <button className="text-white text-2xl"><FaComment /></button>
              <p className="text-white text-sm">{hivee.comments.length}</p>
              <button className="text-white text-2xl"><FaShare /></button>
              <p className="text-white text-sm">{hivee.shares}</p>
              <button className="text-white text-2xl"><FaVolumeUp /></button>
            </div>
          </div>
        ))}
      </div>

      <BottomBar className="absolute bottom-0 w-full z-20" />
    </div>
  );
};

export default Hivees;
