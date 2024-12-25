import React, { useState, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay, faPause, faVolumeMute, faVolumeUp } from '@fortawesome/free-solid-svg-icons';

const InstagramStyleVideoPlayer = ({ videoUrl }) => {
  const [isPlaying, setIsPlaying] = useState(true); // Start video as playing
  const [isMuted, setIsMuted] = useState(true); // Start video as muted
  const [progress, setProgress] = useState(0);
  const videoRef = useRef(null);

  const togglePlayPause = () => {
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  const handleProgressUpdate = () => {
    const currentTime = videoRef.current.currentTime;
    const duration = videoRef.current.duration;
    setProgress((currentTime / duration) * 100);
  };

  return (
    <div className="relative w-full h-auto rounded-lg overflow-hidden">
      {/* Video Element */}
      <video
        ref={videoRef}
        src={videoUrl}
        autoPlay
        loop
        muted={isMuted}
        onTimeUpdate={handleProgressUpdate}
        onClick={togglePlayPause}
        className="w-full h-auto rounded-lg"
      />

      {/* Play/Pause Overlay */}
      {!isPlaying && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 cursor-pointer"
          onClick={togglePlayPause}
        >
          <FontAwesomeIcon icon={faPlay} className="text-white text-6xl" />
        </div>
      )}

      {/* Mute/Unmute Button */}
      <button
        onClick={toggleMute}
        className="absolute bottom-4 right-4 bg-black bg-opacity-50 text-white text-lg p-2 rounded-full hover:bg-opacity-70 focus:outline-none"
      >
        <FontAwesomeIcon icon={isMuted ? faVolumeMute : faVolumeUp} />
      </button>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700">
        <div
          className="h-full bg-blue-500 transition-all duration-200"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </div>
  );
};

export default InstagramStyleVideoPlayer;
