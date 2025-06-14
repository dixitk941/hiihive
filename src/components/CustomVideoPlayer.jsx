import React, { useState, useRef, useEffect } from 'react';
import { FiPlay, FiPause, FiVolume2, FiVolumeX } from 'react-icons/fi';

const CustomVideoPlayer = ({ src, className = "" }) => {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [isInViewport, setIsInViewport] = useState(false);

  // Intersection Observer for auto-play/pause when in/out of viewport
  useEffect(() => {
    const video = videoRef.current;
    const container = containerRef.current;
    
    if (!video || !container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const isVisible = entry.isIntersecting && entry.intersectionRatio >= 0.5; // 50% visible
          setIsInViewport(isVisible);
          
          if (isVisible) {
            // Auto-play when in viewport (muted to comply with browser policies)
            video.muted = true;
            setIsMuted(true);
            video.play().then(() => {
              setIsPlaying(true);
            }).catch((error) => {
              console.log('Auto-play prevented:', error);
            });
          } else {
            // Auto-pause when out of viewport
            video.pause();
            setIsPlaying(false);
          }
        });
      },
      {
        threshold: [0, 0.25, 0.5, 0.75, 1], // Multiple thresholds for smooth detection
        rootMargin: '0px 0px -50px 0px' // Start detection 50px before entering viewport
      }
    );

    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateTime = () => setCurrentTime(video.currentTime);
    const updateDuration = () => setDuration(video.duration);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);

    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('loadedmetadata', updateDuration);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', updateTime);
      video.removeEventListener('loadedmetadata', updateDuration);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlay = async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      if (isPlaying) {
        video.pause();
      } else {
        await video.play();
      }
    } catch (error) {
      console.error('Play/pause error:', error);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    
    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const formatTime = (time) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      ref={containerRef}
      className={`relative bg-black rounded-xl overflow-hidden group ${className}`}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
      onTouchStart={() => setShowControls(true)}
      onTouchEnd={() => setTimeout(() => setShowControls(false), 3000)}
    >
      <video
        ref={videoRef}
        src={src}
        className="w-full h-auto max-h-96 object-contain"
        onClick={togglePlay}
        playsInline // Better mobile support
        preload="metadata"
        controlsList="nodownload noremoteplayback" // Remove download option
        disablePictureInPicture // Disable picture-in-picture
        onContextMenu={(e) => e.preventDefault()} // Disable right-click menu
        onError={(e) => {
          console.error('Video error:', e);
        }}
      />
      
      {/* Minimal Controls - Only Play/Pause and Mute/Unmute */}
      <div className={`absolute inset-0 pointer-events-none transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        {/* Play/Pause Button - Bottom Left */}
        <button
          onClick={togglePlay}
          className="absolute bottom-4 left-4 p-3 bg-black/70 hover:bg-black/90 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/50 pointer-events-auto"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <FiPause size={24} className="text-white" />
          ) : (
            <FiPlay size={24} className="text-white ml-1" />
          )}
        </button>
        
        {/* Mute/Unmute Button - Bottom Right */}
        <button
          onClick={toggleMute}
          className="absolute bottom-4 right-4 p-3 bg-black/70 hover:bg-black/90 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/50 pointer-events-auto"
          aria-label={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? (
            <FiVolumeX size={24} className="text-white" />
          ) : (
            <FiVolume2 size={24} className="text-white" />
          )}
        </button>
      </div>

      {/* Loading indicator */}
      {duration === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="relative w-8 h-8">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-white/30 rounded-full"></div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
          </div>
        </div>
      )}

      {/* Auto-play indicator */}
      {isInViewport && isPlaying && isMuted && (
        <div className="absolute top-4 left-4 bg-black/70 text-white px-2 py-1 rounded text-xs flex items-center space-x-1">
          <FiVolumeX size={12} />
          <span>Auto-playing</span>
        </div>
      )}

      {/* Progress indicator (subtle) */}
      {duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-600/30">
          <div 
            className="h-full bg-white/80 transition-all duration-100"
            style={{ width: `${(currentTime / duration) * 100}%` }}
          />
        </div>
      )}
    </div>
  );
};

export default CustomVideoPlayer;