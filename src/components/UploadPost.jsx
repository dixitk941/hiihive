import React, { useState } from 'react';
import { FaCamera, FaFileVideo, FaFileAudio } from 'react-icons/fa';
import { AiOutlineClose, AiOutlineCloudUpload } from 'react-icons/ai';
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
      const type = selectedFile.type.split('/')[0];
      setFile(selectedFile);
      setFileType(type);
      setPreviewUrl(type === 'text' ? null : URL.createObjectURL(selectedFile)); // No preview for text files
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!caption.trim() && !file) {
      alert('Caption or a file is required.');
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
      let fileUrl = '';
      if (file) {
        const fileRef = storageRef(storage, `posts/${user.uid}/${file.name}`);
        await uploadBytes(fileRef, file);
        fileUrl = await getDownloadURL(fileRef);
      }

      const newPost = {
        userId: user.uid,
        caption,
        fileUrl,
        fileType: file ? fileType : 'text',
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
      alert('Failed to upload post.');
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = () => {
    setFile(null);
    setPreviewUrl(null);
    setFileType('');
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded-xl shadow-lg border border-gray-200 relative">
      <div className="absolute -top-4 right-4 bg-blue-500 text-white p-3 rounded-full shadow-md">
        <AiOutlineCloudUpload size={24} />
      </div>
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <img
            src="/default-profile.png" // Replace with the user’s profile image URL
            alt="User"
            className="w-12 h-12 rounded-full object-cover"
          />
        </div>
        <div className="flex-1">
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Share your thoughts..."
            className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-700 resize-none"
            rows={3}
          />
          {previewUrl && (
            <div className="relative mb-4 mt-4">
              {fileType === 'image' && (
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-56 object-cover rounded-lg shadow-md"
                />
              )}
              {fileType === 'video' && (
                <video src={previewUrl} controls className="w-full h-56 rounded-lg shadow-md" />
              )}
              {fileType === 'audio' && (
                <audio src={previewUrl} controls className="w-full rounded-lg shadow-md" />
              )}
              <button
                onClick={removeFile}
                className="absolute top-2 right-2 bg-gray-800 text-white p-2 rounded-full hover:bg-gray-900"
              >
                <AiOutlineClose size={16} />
              </button>
            </div>
          )}
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2 cursor-pointer text-blue-500 hover:text-blue-700">
                <FaCamera size={18} />
                <span className="text-sm font-medium">Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
              <label className="flex items-center space-x-2 cursor-pointer text-blue-500 hover:text-blue-700">
                <FaFileVideo size={18} />
                <span className="text-sm font-medium">Video</span>
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
              <label className="flex items-center space-x-2 cursor-pointer text-blue-500 hover:text-blue-700">
                <FaFileAudio size={18} />
                <span className="text-sm font-medium">Audio</span>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>
            <button
              onClick={handleSubmit}
              className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold text-sm transition duration-300 ease-in-out"
              disabled={isUploading}
            >
              {isUploading ? 'Posting...' : 'Post'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadPost;
