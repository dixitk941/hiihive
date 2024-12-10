import React, { useState } from 'react';
import { getDatabase, ref, set } from 'firebase/database';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getAuth } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

const UploadHivee = () => {
  const [hiveeContent, setHiveeContent] = useState('');
  const [hiveeVideo, setHiveeVideo] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null); // For video preview
  const [isUploading, setIsUploading] = useState(false);
  const [selectedMusic, setSelectedMusic] = useState('');
  const [musicLibrary] = useState([
    { id: 1, name: 'Song 1', url: '/path/to/song1.mp3' },
    { id: 2, name: 'Song 2', url: '/path/to/song2.mp3' },
    { id: 3, name: 'Song 3', url: '/path/to/song3.mp3' },
  ]);
  const navigate = useNavigate();

  const handleContentChange = (e) => {
    setHiveeContent(e.target.value);
  };

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    setHiveeVideo(file);
    const videoUrl = URL.createObjectURL(file); // Generate a preview URL
    setVideoPreview(videoUrl); // Set the preview URL for the video
  };

  const handleMusicChange = (e) => {
    setSelectedMusic(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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

      // Save to `hivees` collection in the Realtime Database
      const hiveeRef = ref(db, `hivees/${uploadId}`);
      await set(hiveeRef, {
        id: uploadId,
        userId: user.uid,
        username: user.email,
        caption: hiveeContent,
        fileUrl,
        music: selectedMusic,
        timestamp: new Date().toISOString(),
        likes: 0, // Initialize likes
        comments: [], // Initialize comments
        shareCount: 0, // Initialize share count
      });

      // Save to Firestore (User-specific uploads)
      const userHiveeDocRef = doc(firestore, `users/${user.uid}/hivees/${uploadId}`);
      await setDoc(userHiveeDocRef, {
        uploadId,
        type: 'Hivee',
        url: fileUrl,
        caption: hiveeContent,
        music: selectedMusic,
        createdAt: new Date().toISOString(),
        likes: 0, // Initialize likes
        comments: [], // Initialize comments
        shareCount: 0, // Initialize share count  
      });

      setIsUploading(false);
      navigate('/');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Upload Hivee</h2>

        <form onSubmit={handleSubmit}>
          {/* Text Content */}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Write your Hivee
            </label>
            <textarea
              value={hiveeContent}
              onChange={handleContentChange}
              placeholder="Write your hivee..."
              className="w-full p-2 border border-gray-300 rounded"
              rows="4"
            />
          </div>

          {/* Video Upload */}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Upload Video
            </label>
            <input
              type="file"
              accept="video/*"
              onChange={handleVideoChange}
              className="w-full p-2 border border-gray-300 rounded"
            />
          </div>

          {/* Video Preview */}
          {videoPreview && (
            <div className="mb-4">
              <video width="100%" controls>
                <source src={videoPreview} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          )}

          {/* Music Selection */}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Select Music
            </label>
            <select
              className="w-full p-2 border border-gray-300 rounded"
              value={selectedMusic}
              onChange={handleMusicChange}
            >
              <option value="">None</option>
              {musicLibrary.map((music) => (
                <option key={music.id} value={music.url}>
                  {music.name}
                </option>
              ))}
            </select>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isUploading}
              className={`bg-blue-500 text-white p-2 rounded-lg transition-all duration-300 ${
                isUploading ? 'bg-gray-500 cursor-not-allowed' : 'hover:bg-blue-700'
              }`}
            >
              {isUploading ? 'Uploading...' : 'Upload Hivee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UploadHivee;
