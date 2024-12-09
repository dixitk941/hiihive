import React, { useState, useEffect, useRef } from 'react';
import { FaHeart, FaComment, FaShare, FaVolumeUp, FaCamera } from 'react-icons/fa';
import BottomBar from './BottomBar'; // Adjust the import path as necessary

const videos = [
  "https://www.w3schools.com/html/mov_bbb.mp4",
  "https://www.w3schools.com/html/movie.mp4",
  "https://www.w3schools.com/html/mov_bbb.mp4"
];

const Hivees = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef(null);

  const handleScroll = (event) => {
    const container = containerRef.current;
    const scrollTop = container.scrollTop;
    const containerHeight = container.clientHeight;
    const newIndex = Math.round(scrollTop / containerHeight);

    if (newIndex !== currentIndex) {
      setCurrentIndex(newIndex);
    }
  };

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
        <div className="text-white text-2xl font-bold">
          Hivees
        </div>
        <div className="text-white text-2xl">
          <FaCamera />
        </div>
      </div>

      {/* Scrollable container with scroll effect */}
      <div ref={containerRef} className="h-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide pt-16">
        {videos.map((videoSrc, index) => (
          <div
            key={index}
            className="w-full h-screen snap-start relative transition-transform duration-500 ease-in-out"
          >
            <video className="w-full h-full object-contain" muted autoPlay loop>
              <source src={videoSrc} type="video/mp4" />
              Your browser does not support the video tag.
            </video>

            {/* Caption and user details */}
            <div className="absolute bottom-20 left-5 flex flex-col gap-3 z-10">
              <div className="flex items-center gap-2">
                <img src="https://via.placeholder.com/40" alt="User" className="w-10 h-10 rounded-full" />
                <div className="text-white">
                  <p className="font-bold">username</p>
                  <p className="text-sm">Caption goes here...</p>
                </div>
              </div>
              <div className="text-white text-sm mt-2">
                <p>🎵 Music name - Artist</p>
              </div>
            </div>

            {/* Like, comment, and other action buttons */}
            <div className="absolute bottom-20 right-5 flex flex-col items-center gap-3 z-10">
              <button className="text-white text-2xl"><FaHeart /></button>
              <p className="text-white text-sm">1.2k</p>
              <button className="text-white text-2xl"><FaComment /></button>
              <p className="text-white text-sm">345</p>
              <button className="text-white text-2xl"><FaShare /></button>
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