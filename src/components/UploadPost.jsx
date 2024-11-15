import React, { useState } from 'react';
import { FaCamera, FaFileVideo, FaFileAudio, FaPen } from 'react-icons/fa';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { getDatabase, ref, set } from 'firebase/database';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

const UploadPost = () => {
  const [file, setFile] = useState(null);
  const [caption, setCaption] = useState('');
  const [previewUrl, setPreviewUrl] = useState(null);
  const [fileType, setFileType] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFileType(selectedFile.type.split('/')[0]); // Detect file type (e.g., image, video, audio)
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !caption) {
      alert('Please select a file and enter a caption.');
      return;
    }

    setIsUploading(true);
    const auth = getAuth();
    const user = auth.currentUser;
    const firestore = getFirestore();
    const realtimeDb = getDatabase();
    const storage = getStorage();

    if (!user) {
      alert('You must be logged in to upload a post.');
      setIsUploading(false);
      return;
    }

    try {
      const fileRef = storageRef(storage, `posts/${user.uid}/${file.name}`);
      await uploadBytes(fileRef, file);
      const fileUrl = await getDownloadURL(fileRef);

      const newPost = {
        userId: user.uid,
        caption,
        fileUrl,
        fileType,
        timestamp: new Date().toISOString(),
        likes: 0,
        comments: [],
        shareCount: 0,
      };

      const docRef = await addDoc(collection(firestore, `users/${user.uid}/posts`), newPost);
      const postId = docRef.id;

      await set(ref(realtimeDb, 'feeds/' + postId), {
        ...newPost,
        username: user.displayName || user.email,
        id: postId,
      });

      setFile(null);
      setCaption('');
      setPreviewUrl(null);
      alert('Post uploaded successfully!');
    } catch (error) {
      console.error('Error uploading post:', error);
      alert('Failed to upload post.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto mt-6 p-4 bg-white shadow-lg rounded-lg">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">New Post</h2>
      <div className="mb-4">
        {previewUrl ? (
          fileType === 'image' ? (
            <img src={previewUrl} alt="Preview" className="w-full h-64 object-cover rounded-lg" />
          ) : fileType === 'video' ? (
            <video src={previewUrl} controls className="w-full h-64 rounded-lg" />
          ) : fileType === 'audio' ? (
            <audio src={previewUrl} controls className="w-full rounded-lg" />
          ) : (
            <p className="text-gray-600">{caption}</p>
          )
        ) : (
          <label className="cursor-pointer flex flex-col items-center text-gray-500">
            <FaCamera size={48} />
            <span>Select File (Image, Video, Audio, or Text)</span>
            <input
              type="file"
              accept="image/*,video/*,audio/*,.txt"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        )}
      </div>
      <textarea
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        placeholder="Write a caption..."
        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none mb-4"
        rows={3}
      />
      <button
        onClick={handleSubmit}
        className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg font-semibold"
        disabled={isUploading}
      >
        {isUploading ? 'Uploading...' : 'Post'}
      </button>
    </div>
  );
};

export default UploadPost;
