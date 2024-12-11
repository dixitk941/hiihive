import React, { useState, useEffect, useRef } from 'react';
import { getDatabase, ref, set } from 'firebase/database';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL, listAll } from 'firebase/storage';
import { getAuth } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { FiMusic, FiVideo, FiArrowRightCircle, FiArrowLeftCircle } from 'react-icons/fi';

const UploadHivee = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [hiveeContent, setHiveeContent] = useState('');
  const [hiveeVideo, setHiveeVideo] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedMusic, setSelectedMusic] = useState('');
  const [musicLibrary, setMusicLibrary] = useState([]);
  const [musicStartTime, setMusicStartTime] = useState(0); // Track start time
  const [musicEndTime, setMusicEndTime] = useState(10);   // Track end time
  const musicPlayerRef = useRef(null); // Ref for the music player
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMusicLibrary = async () => {
      const storage = getStorage();
      const musicFolderRef = storageRef(storage, 'music/');
      const musicList = await listAll(musicFolderRef);

      const musicFiles = await Promise.all(
        musicList.items.map(async (item) => {
          const url = await getDownloadURL(item);
          return { name: item.name, url };
        })
      );

      setMusicLibrary(musicFiles);
    };

    fetchMusicLibrary();
  }, []);

  const handleContentChange = (e) => setHiveeContent(e.target.value);
  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    setHiveeVideo(file);
    setVideoPreview(URL.createObjectURL(file));
  };
  const handleMusicChange = (url) => {
    setSelectedMusic(url);
    if (musicPlayerRef.current) {
      musicPlayerRef.current.load(); // Reload the player when music is selected
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

    const auth = getAuth();
    const user = auth.currentUser;
    const db = getDatabase();
    const storage = getStorage();
    const firestore = getFirestore();

    if (hiveeVideo && user) {
      const fileRef = storageRef(storage, `uploads/${user.uid}/${hiveeVideo.name}`);
      await uploadBytes(fileRef, hiveeVideo);
      const fileUrl = await getDownloadURL(fileRef);

      const uploadId = uuidv4();

      const hiveeRef = ref(db, `hivees/${uploadId}`);
      await set(hiveeRef, {
        id: uploadId,
        userId: user.uid,
        username: user.email,
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

      setIsUploading(false);
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-white to-gray-200 flex items-center justify-center">
      <div className="bg-white bg-opacity-80 backdrop-blur-lg p-6 rounded-3xl shadow-lg w-full max-w-lg">
        <h2 className="text-2xl font-bold text-gray-700 mb-4 text-center">
          🚀 Upload Your Hivee
        </h2>

        {/* Step 1: Upload Video */}
        {currentStep === 1 && (
          <div className="flex flex-col gap-4">
            <div className="mb-4">
              <label className="block text-gray-600 text-sm mb-2">Upload Video</label>
              <div className="relative group flex items-center justify-center border-dashed border-2 rounded-xl p-6 bg-gray-50">
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleVideoChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <FiVideo className="text-4xl text-blue-500 group-hover:scale-110 transition-transform" />
                <span className="text-gray-600 text-sm mt-2">Drag or click to upload</span>
              </div>
            </div>

            {videoPreview && (
              <div className="mb-4">
                <video width="100%" controls className="rounded-xl">
                  <source src={videoPreview} type="video/mp4" />
                </video>
              </div>
            )}

            <div className="flex justify-between">
              <button
                onClick={handleNext}
                disabled={!hiveeVideo}
                className={`px-6 py-3 rounded-full font-medium text-white shadow-lg transition-all ${
                  !hiveeVideo ? 'bg-gray-300 cursor-not-allowed' : 'bg-gradient-to-r from-blue-400 to-blue-600 hover:from-blue-500 hover:to-blue-700'
                }`}
              >
                Next <FiArrowRightCircle />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Choose Music */}
        {currentStep === 2 && (
          <div className="flex flex-col gap-4">
            <div className="mb-4">
              <label className="block text-gray-600 text-sm mb-2">Select Background Music</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {musicLibrary.map((music, index) => (
                  <div
                    key={index}
                    onClick={() => handleMusicChange(music.url)}
                    className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer ${
                      selectedMusic === music.url ? 'border-blue-500 bg-blue-100' : 'border-gray-200'
                    }`}
                  >
                    <FiMusic className="text-blue-500" />
                    <span className="text-gray-700">{music.name}</span>
                  </div>
                ))}
              </div>

              {selectedMusic && (
                <div className="mt-4">
                  <audio
                    ref={musicPlayerRef}
                    controls
                    src={selectedMusic}
                    className="w-full"
                  />
                  <div className="relative mt-2">
                    <div className="w-full h-2 bg-gray-300 rounded-full">
                      <div
                        className="h-2 bg-blue-500 rounded-full"
                        style={{
                          width: `${(musicEndTime - musicStartTime) * 100 / 60}%`,
                          transform: `translateX(${(musicStartTime / 60) * 100}%)`,
                        }}
                      />
                    </div>
                    <div className="flex justify-between mt-2 text-sm">
                      <div className="flex items-center gap-2">
                        <label className="text-gray-600">Start Time</label>
                        <input
                          type="number"
                          value={musicStartTime}
                          min="0"
                          max="60"
                          onChange={handleMusicStartTimeChange}
                          className="w-16 p-2 border rounded"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-gray-600">End Time</label>
                        <input
                          type="number"
                          value={musicEndTime}
                          min="0"
                          max="60"
                          onChange={handleMusicEndTimeChange}
                          className="w-16 p-2 border rounded"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between">
              <button onClick={handleBack} className="text-gray-700 hover:underline">
                <FiArrowLeftCircle /> Back
              </button>

              <button
                onClick={handleNext}
                disabled={!selectedMusic}
                className={`px-6 py-3 rounded-full font-medium text-white shadow-lg transition-all ${
                  !selectedMusic ? 'bg-gray-300 cursor-not-allowed' : 'bg-gradient-to-r from-blue-400 to-blue-600 hover:from-blue-500 hover:to-blue-700'
                }`}
              >
                Next <FiArrowRightCircle />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Add Caption */}
        {currentStep === 3 && (
          <div className="flex flex-col gap-4">
            <div className="mb-4">
              <label className="block text-gray-600 text-sm mb-2">Add Caption</label>
              <textarea
                value={hiveeContent}
                onChange={handleContentChange}
                className="w-full p-4 border rounded-lg text-gray-700"
                placeholder="Add a caption..."
                rows="3"
              />
            </div>

            <div className="flex justify-between">
              <button onClick={handleBack} className="text-gray-700 hover:underline">
                <FiArrowLeftCircle /> Back
              </button>

              <button
                onClick={handleSubmit}
                disabled={isUploading || !hiveeContent.trim()}
                className={`px-6 py-3 rounded-full font-medium text-white shadow-lg transition-all ${
                  isUploading || !hiveeContent.trim() ? 'bg-gray-300 cursor-not-allowed' : 'bg-gradient-to-r from-blue-400 to-blue-600 hover:from-blue-500 hover:to-blue-700'
                }`}
              >
                {isUploading ? 'Uploading...' : 'Submit'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadHivee;
