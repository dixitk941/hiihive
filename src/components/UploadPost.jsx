import React, { useState } from 'react';
import { getDatabase, ref, set } from 'firebase/database';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getAuth } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

const UploadContent = () => {
  const [uploadType, setUploadType] = useState('Post'); // 'Post' or 'Hivee'
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [caption, setCaption] = useState('');
  const [selectedMusic, setSelectedMusic] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [musicLibrary] = useState([
    { id: 1, name: 'Song 1', url: '/path/to/song1.mp3' },
    { id: 2, name: 'Song 2', url: '/path/to/song2.mp3' },
    { id: 3, name: 'Song 3', url: '/path/to/song3.mp3' },
  ]);
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setFilePreview(URL.createObjectURL(selectedFile));
  };

  const handleUpload = async () => {
    setIsUploading(true);
    const auth = getAuth();
    const user = auth.currentUser;
    const db = getDatabase();
    const storage = getStorage();
    const firestore = getFirestore();

    if (file && user) {
      const fileRef = storageRef(storage, `uploads/${user.uid}/${file.name}`);
      await uploadBytes(fileRef, file);
      const fileUrl = await getDownloadURL(fileRef);

      const uploadId = uuidv4();

      if (uploadType === 'Post') {
        // Post - Save to `feeds` collection
        const postRef = ref(db, `feeds/${uploadId}`);
        await set(postRef, {
          id: uploadId,
          userId: user.uid,
          username: user.email,
          caption,
          fileUrl,
          fileType: uploadType === 'Post' ? 'image' : 'video',
          timestamp: new Date().toISOString(),
          likes: 0,
          shareCount: 0,
          comments: [],
        });

        const userDocRef = doc(firestore, `users/${user.uid}/uploads/${uploadId}`);
        await setDoc(userDocRef, {
          uploadId,
          type: 'Post',
          url: fileUrl,
          caption,
          createdAt: new Date().toISOString(),
        });
      } else if (uploadType === 'Hivee') {
        // Hivee - Save to `hivees` collection
        const hiveeRef = ref(db, `hivees/${uploadId}`);
        await set(hiveeRef, {
          id: uploadId,
          userId: user.uid,
          username: user.email,
          caption,
          fileUrl,
          fileType: uploadType === 'Post' ? 'image' : 'video',
          music: selectedMusic,
          timestamp: new Date().toISOString(),
        });

        const userHiveeDocRef = doc(firestore, `users/${user.uid}/hivees/${uploadId}`);
        await setDoc(userHiveeDocRef, {
          uploadId,
          type: 'Hivee',
          url: fileUrl,
          caption,
          music: selectedMusic,
          createdAt: new Date().toISOString(),
        });
      }

      setIsUploading(false);
      navigate('/');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <div className="flex justify-between mb-4">
          <button
            className={`flex-1 p-2 text-center ${uploadType === 'Post' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setUploadType('Post')}
          >
            Post
          </button>
          <button
            className={`flex-1 p-2 text-center ${uploadType === 'Hivee' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setUploadType('Hivee')}
          >
            Hivee
          </button>
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            {uploadType === 'Post' ? 'Upload Image' : 'Upload Video'}
          </label>
          <input
            type="file"
            accept={uploadType === 'Post' ? 'image/*' : 'video/*'}
            className="w-full p-2 border border-gray-300 rounded"
            onChange={handleFileChange}
          />
        </div>

        {filePreview && uploadType === 'Hivee' && (
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">Video Preview</label>
            <video className="w-full" controls>
              <source src={filePreview} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        )}

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Caption
          </label>
          <textarea
            className="w-full p-2 border border-gray-300 rounded"
            rows="3"
            placeholder="Write a caption..."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
          ></textarea>
        </div>

        {uploadType === 'Hivee' && (
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Select Music
            </label>
            <select
              className="w-full p-2 border border-gray-300 rounded"
              value={selectedMusic}
              onChange={(e) => setSelectedMusic(e.target.value)}
            >
              <option value="">None</option>
              {musicLibrary.map((music) => (
                <option key={music.id} value={music.url}>
                  {music.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex justify-end">
          <button
            onClick={handleUpload}
            disabled={isUploading}
            className={`bg-blue-500 text-white p-2 rounded-lg transition-all duration-300 ${
              isUploading ? 'bg-gray-500 cursor-not-allowed' : 'hover:bg-blue-700'
            }`}
          >
            {isUploading ? 'Posting...' : 'Post'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadContent;
