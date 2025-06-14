import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay, faPause, faVolumeHigh, faVolumeXmark, faExpand, faHeart } from '@fortawesome/free-solid-svg-icons';

const InstagramStyleVideoPlayer = ({ videoUrl, isDarkMode = false }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [isInView, setIsInView] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [volume, setVolume] = useState(1);
  const [isLiked, setIsLiked] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const videoRef = useRef(null);
  const playPromiseRef = useRef(null);
  const observerRef = useRef(null);
  const controlsTimeoutRef = useRef(null);

  const safePlay = useCallback(async () => {
    if (!videoRef.current || !videoRef.current.paused) return;
    
    try {
      if (playPromiseRef.current) {
        await playPromiseRef.current;
      }
      
      playPromiseRef.current = videoRef.current.play();
      await playPromiseRef.current;
      setIsPlaying(true);
      playPromiseRef.current = null;
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.warn('Video play failed:', error);
      }
      playPromiseRef.current = null;
    }
  }, []);

  const safePause = useCallback(async () => {
    if (!videoRef.current || videoRef.current.paused) return;
    
    try {
      if (playPromiseRef.current) {
        await playPromiseRef.current;
      }
      
      videoRef.current.pause();
      setIsPlaying(false);
      playPromiseRef.current = null;
    } catch (error) {
      console.warn('Video pause failed:', error);
      playPromiseRef.current = null;
    }
  }, []);

  const togglePlayPause = useCallback(() => {
    if (!videoRef.current) return;
    
    if (videoRef.current.paused) {
      safePlay();
    } else {
      safePause();
    }
  }, [safePlay, safePause]);

  const toggleMute = useCallback(() => {
    if (!videoRef.current) return;
    
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  }, []);

  const handleVolumeChange = useCallback((newVolume) => {
    if (!videoRef.current) return;
    
    videoRef.current.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
    videoRef.current.muted = newVolume === 0;
  }, []);

  const handleProgressUpdate = useCallback(() => {
    if (!videoRef.current || !videoRef.current.duration) return;
    
    const progress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
    setProgress(progress);
  }, []);

  const handleProgressClick = useCallback((e) => {
    if (!videoRef.current || !videoRef.current.duration) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const newTime = (clickX / width) * videoRef.current.duration;
    videoRef.current.currentTime = newTime;
  }, []);

  const showControlsTemporarily = useCallback(() => {
    setShowControls(true);
    
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  }, []);

  const handleVideoClick = useCallback(() => {
    togglePlayPause();
    showControlsTemporarily();
  }, [togglePlayPause, showControlsTemporarily]);

  const handleMouseMove = useCallback(() => {
    showControlsTemporarily();
  }, [showControlsTemporarily]);

  const toggleFullscreen = useCallback(() => {
    if (!videoRef.current) return;
    
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      videoRef.current.requestFullscreen();
    }
  }, []);

  const toggleLike = useCallback(() => {
    setIsLiked(!isLiked);
  }, [isLiked]);

  // Handle intersection observer
  useEffect(() => {
    const handleIntersection = (entries) => {
      entries.forEach(entry => {
        if (!videoRef.current) return;
        
        setIsInView(entry.isIntersecting);
        
        if (entry.isIntersecting) {
          safePlay();
        } else {
          safePause();
        }
      });
    };

    observerRef.current = new IntersectionObserver(handleIntersection, { 
      threshold: 0.5,
      rootMargin: '0px'
    });
    
    if (videoRef.current) {
      observerRef.current.observe(videoRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [safePlay, safePause]);

  // Handle video events
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const handleLoadedData = () => {
      if (isInView && videoRef.current) {
        safePlay();
      }
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleError = (e) => {
      console.error('Video error:', e);
      setIsPlaying(false);
    };

    const handleCanPlay = () => {
      if (isInView && videoRef.current) {
        safePlay();
      }
    };

    videoElement.addEventListener('timeupdate', handleProgressUpdate);
    videoElement.addEventListener('loadeddata', handleLoadedData);
    videoElement.addEventListener('canplay', handleCanPlay);
    videoElement.addEventListener('play', handlePlay);
    videoElement.addEventListener('pause', handlePause);
    videoElement.addEventListener('error', handleError);

    return () => {
      if (videoElement) {
        videoElement.removeEventListener('timeupdate', handleProgressUpdate);
        videoElement.removeEventListener('loadeddata', handleLoadedData);
        videoElement.removeEventListener('canplay', handleCanPlay);
        videoElement.removeEventListener('play', handlePlay);
        videoElement.removeEventListener('pause', handlePause);
        videoElement.removeEventListener('error', handleError);
      }
    };
  }, [handleProgressUpdate, safePlay, isInView]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (playPromiseRef.current) {
        playPromiseRef.current.catch(() => {});
      }
      
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div 
      className={`relative w-full aspect-video rounded-2xl overflow-hidden shadow-2xl ${
        isDarkMode ? 'bg-gray-900' : 'bg-white'
      } group`}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        src={videoUrl}
        muted={isMuted}
        playsInline
        loop
        preload="metadata"
        className="w-full h-full object-cover cursor-pointer"
        onClick={handleVideoClick}
        onLoadStart={() => setIsPlaying(false)}
      />
      
      {/* Loading Overlay */}
      {!isPlaying && progress === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 border-4 border-white/30 rounded-full"></div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
          </div>
        </div>
      )}

      {/* Play/Pause Overlay */}
      {!isPlaying && progress > 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <button
            onClick={togglePlayPause}
            className="w-20 h-20 bg-white bg-opacity-90 rounded-full flex items-center justify-center shadow-lg hover:bg-opacity-100 transition-all duration-300 transform hover:scale-110"
          >
            <FontAwesomeIcon 
              icon={faPlay} 
              className="text-gray-800 text-2xl ml-1" 
            />
          </button>
        </div>
      )}

      {/* Progress Bar */}
      <div 
        className="absolute bottom-0 left-0 w-full h-1 bg-gray-300 bg-opacity-50 cursor-pointer hover:h-2 transition-all duration-200"
        onClick={handleProgressClick}
      >
        <div 
          className="bg-gradient-to-r from-blue-500 to-purple-600 h-full transition-all duration-100 relative"
          style={{ width: `${progress}%` }}
        >
          <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
        </div>
      </div>

      {/* Controls Overlay */}
      <div className={`absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent transition-opacity duration-300 ${
        showControls ? 'opacity-100' : 'opacity-0'
      }`}>
        
        {/* Top Controls */}
        <div className="absolute top-4 right-4 flex space-x-3">
          <button
            onClick={toggleLike}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
              isLiked 
                ? 'bg-red-500 text-white' 
                : 'bg-black bg-opacity-50 text-white hover:bg-opacity-70'
            }`}
          >
            <FontAwesomeIcon 
              icon={faHeart} 
              className={`text-sm ${isLiked ? 'animate-pulse' : ''}`} 
            />
          </button>
          
          <button
            onClick={toggleFullscreen}
            className="w-10 h-10 bg-black bg-opacity-50 text-white rounded-full flex items-center justify-center hover:bg-opacity-70 transition-all duration-300"
          >
            <FontAwesomeIcon icon={faExpand} className="text-sm" />
          </button>
        </div>

        {/* Bottom Controls */}
        <div className="absolute bottom-6 left-4 right-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={togglePlayPause}
              className="w-12 h-12 bg-white bg-opacity-90 text-gray-800 rounded-full flex items-center justify-center hover:bg-opacity-100 transition-all duration-300 shadow-lg"
            >
              <FontAwesomeIcon 
                icon={isPlaying ? faPause : faPlay} 
                className={`text-lg ${!isPlaying ? 'ml-1' : ''}`} 
              />
            </button>

            <div 
              className="relative"
              onMouseEnter={() => setShowVolumeSlider(true)}
              onMouseLeave={() => setShowVolumeSlider(false)}
            >
              <button
                onClick={toggleMute}
                className="w-10 h-10 bg-black bg-opacity-50 text-white rounded-full flex items-center justify-center hover:bg-opacity-70 transition-all duration-300"
              >
                <FontAwesomeIcon 
                  icon={isMuted ? faVolumeXmark : faVolumeHigh} 
                  className="text-sm" 
                />
              </button>

              {/* Volume Slider */}
              {showVolumeSlider && (
                <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-80 rounded-lg p-2">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={volume}
                    onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                    className="w-20 h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer slider"
                    style={{
                      background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${volume * 100}%, #d1d5db ${volume * 100}%, #d1d5db 100%)`
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Time Display */}
          <div className="bg-black bg-opacity-50 text-white text-sm px-3 py-1 rounded-full">
            {Math.floor(progress)}%
          </div>
        </div>
      </div>

      {/* Custom Slider Styles */}
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        
        .slider::-moz-range-thumb {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
      `}</style>
    </div>
  );
};

export default InstagramStyleVideoPlayer;