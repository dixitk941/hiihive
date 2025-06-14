import React, { useState, useEffect, useRef } from 'react';
import { getDatabase, ref, set } from 'firebase/database';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL, listAll } from 'firebase/storage';
import { getAuth } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

const UploadHivee = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [hiveeContent, setHiveeContent] = useState('');
  const [hiveeVideo, setHiveeVideo] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedMusic, setSelectedMusic] = useState('');
  const [musicLibrary, setMusicLibrary] = useState([]);
  const [musicStartTime, setMusicStartTime] = useState(0);
  const [musicEndTime, setMusicEndTime] = useState(10);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const musicPlayerRef = useRef(null);
  const navigate = useNavigate();

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

  useEffect(() => {
    const fetchMusicLibrary = async () => {
      try {
        const storage = getStorage();
        const musicFolderRef = storageRef(storage, 'music/');
        const musicList = await listAll(musicFolderRef);

        const musicFiles = await Promise.all(
          musicList.items.map(async (item) => {
            const url = await getDownloadURL(item);
            return { 
              name: item.name.replace(/\.[^/.]+$/, ""), // Remove file extension
              url,
              duration: 60 // Default duration
            };
          })
        );

        setMusicLibrary(musicFiles);
      } catch (error) {
        console.error('Error fetching music library:', error);
      }
    };

    fetchMusicLibrary();
  }, []);

  const handleContentChange = (e) => setHiveeContent(e.target.value);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('video/')) {
        setHiveeVideo(file);
        setVideoPreview(URL.createObjectURL(file));
      }
    }
  };

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setHiveeVideo(file);
      setVideoPreview(URL.createObjectURL(file));
    }
  };

  const handleMusicChange = (music) => {
    setSelectedMusic(music.url);
    if (musicPlayerRef.current) {
      musicPlayerRef.current.load();
    }
  };

  const handleMusicStartTimeChange = (e) => {
    const newStartTime = Math.min(parseFloat(e.target.value), musicEndTime - 1);
    setMusicStartTime(newStartTime);
  };

  const handleMusicEndTimeChange = (e) => {
    const newEndTime = Math.max(parseFloat(e.target.value), musicStartTime + 1);
    setMusicEndTime(newEndTime);
  };

  const handleNext = () => {
    if (currentStep === 1 && hiveeVideo) {
      setCurrentStep(2);
    } else if (currentStep === 2 && selectedMusic) {
      setCurrentStep(3);
    } else if (currentStep === 3 && hiveeContent.trim()) {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsUploading(true);
    setUploadProgress(0);

    const auth = getAuth();
    const user = auth.currentUser;
    const db = getDatabase();
    const storage = getStorage();
    const firestore = getFirestore();

    if (hiveeVideo && user) {
      try {
        setUploadProgress(20);
        const fileRef = storageRef(storage, `hivees/${user.uid}/${Date.now()}_${hiveeVideo.name}`);
        await uploadBytes(fileRef, hiveeVideo);
        
        setUploadProgress(60);
        const fileUrl = await getDownloadURL(fileRef);

        const uploadId = uuidv4();

        setUploadProgress(80);
        const hiveeRef = ref(db, `hivees/${uploadId}`);
        await set(hiveeRef, {
          id: uploadId,
          userId: user.uid,
          username: user.displayName || user.email,
          caption: hiveeContent,
          fileUrl,
          music: selectedMusic,
          musicStartTime,
          musicEndTime,
          timestamp: new Date().toISOString(),
          likes: 0,
          comments: [],
          shareCount: 0,
        });

        const userHiveeDocRef = doc(firestore, `users/${user.uid}/hivees/${uploadId}`);
        await setDoc(userHiveeDocRef, {
          uploadId,
          type: 'Hivee',
          url: fileUrl,
          caption: hiveeContent,
          music: selectedMusic,
          musicStartTime,
          musicEndTime,
          createdAt: new Date().toISOString(),
          likes: 0,
          comments: [],
          shareCount: 0,
        });

        setUploadProgress(100);
        
        setTimeout(() => {
          setIsUploading(false);
          navigate('/hivee');
        }, 1000);
      } catch (error) {
        console.error('Upload error:', error);
        setIsUploading(false);
        alert('Failed to upload Hivee. Please try again.');
      }
    }
  };

  const removeVideo = () => {
    setHiveeVideo(null);
    setVideoPreview(null);
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode ? 'bg-black' : 'bg-gray-50'
    }`}>
      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-2xl font-bold mb-2 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Create Hivee
          </h1>
          <p className={`text-sm ${
            isDarkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>
            Share your creative short video
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                  currentStep >= step
                    ? 'bg-blue-500 text-white'
                    : isDarkMode
                      ? 'bg-gray-800 text-gray-400'
                      : 'bg-gray-200 text-gray-500'
                }`}>
                  {step}
                </div>
                {step < 3 && (
                  <div className={`w-16 h-1 mx-2 rounded-full transition-all duration-300 ${
                    currentStep > step
                      ? 'bg-blue-500'
                      : isDarkMode
                        ? 'bg-gray-800'
                        : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="text-center">
            <span className={`text-sm font-medium ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              {currentStep === 1 && 'Upload Video'}
              {currentStep === 2 && 'Choose Music'}
              {currentStep === 3 && 'Add Caption'}
            </span>
          </div>
        </div>

        {/* Step 1: Upload Video */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div
              className={`relative rounded-3xl border-2 border-dashed transition-all duration-300 ${
                dragActive
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10'
                  : isDarkMode
                    ? 'border-gray-700 bg-gray-900'
                    : 'border-gray-300 bg-white'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {!videoPreview ? (
                <div className="p-8 text-center">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                    isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
                  }`}>
                    <svg className={`w-8 h-8 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className={`text-lg font-medium mb-2 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    Upload your video
                  </p>
                  <p className={`text-sm ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    Drag and drop or click to browse
                  </p>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleVideoChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
              ) : (
                <div className="relative p-4">
                  <div className="relative rounded-2xl overflow-hidden">
                    <video
                      src={videoPreview}
                      controls
                      className="w-full h-64 object-cover"
                    />
                  </div>
                  <button
                    onClick={removeVideo}
                    className="absolute top-6 right-6 w-8 h-8 bg-black bg-opacity-60 text-white rounded-full flex items-center justify-center hover:bg-opacity-80 transition-all duration-200"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={handleNext}
              disabled={!hiveeVideo}
              className={`w-full py-4 px-6 rounded-2xl font-semibold text-lg transition-all duration-200 ${
                !hiveeVideo
                  ? isDarkMode
                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-500 text-white hover:bg-blue-600 active:scale-95 shadow-lg shadow-blue-500/25'
              }`}
            >
              Continue
            </button>
          </div>
        )}

        {/* Step 2: Choose Music */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className={`rounded-3xl p-6 border ${
              isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <h3 className={`text-lg font-semibold mb-4 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Select Background Music
              </h3>
              
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {musicLibrary.map((music, index) => (
                  <button
                    key={index}
                    onClick={() => handleMusicChange(music)}
                    className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all duration-200 ${
                      selectedMusic === music.url
                        ? 'bg-blue-500 text-white'
                        : isDarkMode
                          ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      selectedMusic === music.url ? 'bg-white/20' : 'bg-blue-500'
                    }`}>
                      <svg className={`w-5 h-5 ${
                        selectedMusic === music.url ? 'text-white' : 'text-white'
                      }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                      </svg>
                    </div>
                    <span className="font-medium">{music.name}</span>
                  </button>
                ))}
              </div>

              {selectedMusic && (
                <div className="mt-6 space-y-4">
                  <audio
                    ref={musicPlayerRef}
                    controls
                    src={selectedMusic}
                    className="w-full"
                  />
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className={`text-sm font-medium ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Music Timing
                      </span>
                      <span className={`text-xs ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        {musicStartTime}s - {musicEndTime}s
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={`block text-xs font-medium mb-1 ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          Start Time (s)
                        </label>
                        <input
                          type="number"
                          value={musicStartTime}
                          min="0"
                          max="60"
                          onChange={handleMusicStartTimeChange}
                          className={`w-full p-2 rounded-xl border ${
                            isDarkMode
                              ? 'bg-gray-800 border-gray-600 text-white'
                              : 'bg-white border-gray-300 text-gray-900'
                          } focus:outline-none focus:border-blue-500`}
                        />
                      </div>
                      <div>
                        <label className={`block text-xs font-medium mb-1 ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          End Time (s)
                        </label>
                        <input
                          type="number"
                          value={musicEndTime}
                          min="0"
                          max="60"
                          onChange={handleMusicEndTimeChange}
                          className={`w-full p-2 rounded-xl border ${
                            isDarkMode
                              ? 'bg-gray-800 border-gray-600 text-white'
                              : 'bg-white border-gray-300 text-gray-900'
                          } focus:outline-none focus:border-blue-500`}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleBack}
                className={`flex-1 py-3 px-6 rounded-2xl font-semibold transition-all duration-200 ${
                  isDarkMode
                    ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Back
              </button>
              <button
                onClick={handleNext}
                disabled={!selectedMusic}
                className={`flex-1 py-3 px-6 rounded-2xl font-semibold transition-all duration-200 ${
                  !selectedMusic
                    ? isDarkMode
                      ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-500 text-white hover:bg-blue-600 active:scale-95'
                }`}
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Add Caption */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className={`rounded-3xl p-6 border ${
              isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <h3 className={`text-lg font-semibold mb-4 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Add Caption
              </h3>
              <textarea
                value={hiveeContent}
                onChange={handleContentChange}
                placeholder="What's this Hivee about?"
                rows={4}
                className={`w-full p-4 rounded-2xl border resize-none ${
                  isDarkMode
                    ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                } focus:outline-none focus:border-blue-500`}
              />
            </div>

            {/* Upload Progress */}
            {isUploading && (
              <div className={`rounded-2xl p-4 border ${
                isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm font-medium ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    Uploading Hivee...
                  </span>
                  <span className={`text-sm ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    {uploadProgress}%
                  </span>
                </div>
                <div className={`w-full rounded-full h-2 ${
                  isDarkMode ? 'bg-gray-800' : 'bg-gray-200'
                }`}>
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleBack}
                disabled={isUploading}
                className={`flex-1 py-3 px-6 rounded-2xl font-semibold transition-all duration-200 ${
                  isUploading
                    ? 'opacity-50 cursor-not-allowed'
                    : isDarkMode
                      ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={isUploading || !hiveeContent.trim()}
                className={`flex-1 py-3 px-6 rounded-2xl font-semibold transition-all duration-200 ${
                  isUploading || !hiveeContent.trim()
                    ? isDarkMode
                      ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-500 text-white hover:bg-blue-600 active:scale-95'
                }`}
              >
                {isUploading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="relative w-4 h-4">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-4 h-4 border-2 border-white/30 rounded-full"></div>
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      </div>
                    </div>
                    <span>Publishing...</span>
                  </div>
                ) : (
                  'Publish Hivee'
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadHivee;