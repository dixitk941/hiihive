import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay, faPause, faVolumeMute, faVolumeUp } from '@fortawesome/free-solid-svg-icons';

const InstagramStyleVideoPlayer = ({ videoUrl }) => {
  const [isPlaying, setIsPlaying] = useState(true); // Start video as playing
  const [isMuted, setIsMuted] = useState(true); // Start video as muted
  const [progress, setProgress] = useState(0);
  const videoRef = useRef(null);

  const togglePlayPause = useCallback(() => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  }, []);

  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  }, []);

  const handleProgressUpdate = () => {
    if (videoRef.current) {
      const progress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(progress);
    }
  };

  useEffect(() => {
    const videoElement = videoRef.current;
    if (videoElement) {
      videoElement.addEventListener('timeupdate', handleProgressUpdate);
    }

    return () => {
      if (videoElement) {
        videoElement.removeEventListener('timeupdate', handleProgressUpdate);
      }
    };
  }, []);

  useEffect(() => {
    const handleIntersection = (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          if (videoRef.current.paused) {
            videoRef.current.play();
            setIsPlaying(true);
          }
        } else {
          if (!videoRef.current.paused) {
            videoRef.current.pause();
            setIsPlaying(false);
          }
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersection, { threshold: 0.5 });
    if (videoRef.current) {
      observer.observe(videoRef.current);
    }

    return () => {
      if (videoRef.current) {
        observer.unobserve(videoRef.current);
      }
    };
  }, []);

  return (
    <div className="relative w-full max-w-md mx-auto rounded-lg overflow-hidden shadow-lg bg-gradient-to-r from-purple-500 to-indigo-500">
      <video
        ref={videoRef}
        src={videoUrl}
        onTimeUpdate={handleProgressUpdate}
        muted={isMuted}
        autoPlay
        playsInline
        className="w-full h-auto"
      />
      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex justify-center items-center bg-black bg-opacity-50 rounded-full p-2 backdrop-blur-md">
        <button
          onClick={togglePlayPause}
          className="text-white mx-2 hover:text-yellow-500 transition duration-300"
          tabIndex="0"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          <FontAwesomeIcon icon={isPlaying ? faPause : faPlay} />
        </button>
        <button
          onClick={toggleMute}
          className="text-white mx-2 hover:text-yellow-500 transition duration-300"
          tabIndex="0"
          aria-label={isMuted ? 'Unmute' : 'Mute'}
        >
          <FontAwesomeIcon icon={isMuted ? faVolumeMute : faVolumeUp} />
        </button>
      </div>
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-300 rounded-full overflow-hidden">
        <div className="bg-red-500 h-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
      </div>
    </div>
  );
};

export default InstagramStyleVideoPlayer;
