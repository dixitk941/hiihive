import React, { useState, useEffect } from 'react';
import { FaCamera, FaFileVideo, FaFileAudio } from 'react-icons/fa';
import { AiOutlineClose, AiOutlineCloudUpload } from 'react-icons/ai';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { getDatabase, ref, set } from 'firebase/database';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getAuth } from 'firebase/auth';
import styled from 'styled-components';

const Button = styled.button`
  background-color: #4e8bff;
  color: white;
  border: none;
  border-radius: 30px;
  padding: 12px 24px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s ease, transform 0.2s ease;

  &:hover {
    background-color: #3871cc;
    transform: scale(1.05);
  }

  &:disabled {
    background-color: #b0c4de;
    cursor: not-allowed;
  }
`;

const UploadPost = () => {
  const [file, setFile] = useState(null);
  const [caption, setCaption] = useState('');
  const [previewUrl, setPreviewUrl] = useState(null);
  const [fileType, setFileType] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [hashtags, setHashtags] = useState([]);
  const [filteredHashtags, setFilteredHashtags] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Fetch trending hashtags
  useEffect(() => {
    const fetchTrendingHashtags = async () => {
      // Replace this with your actual API logic
      const trendingHashtags = [
'ReactJS',
        'WebDevelopment',
        'AI',
        'HiiHiveLaunch',
        'JavaScript',
        'TailwindCSS',
        'OpenSource',
        'CloudComputing',
        'MVP',
        'TrendingNow',
        'StartupLife',
        'Innovation',
        'DataScience',
        'Coding',
        'TechNews',
        'Design',
        'Productivity',
        'Crypto',
        'Blockchain',
        'MachineLearning',
        'UIUX',
        'FullStack',
        'FrontEnd',
        'BackEnd',
        'DevOps',
        'MobileDevelopment',
        'CloudNative',
        'OpenAI',
        'ReactNative',
        'VueJS',
        'Angular',
        'NextJS',
        'NodeJS',
        'CyberSecurity',
        'Agile',
        'Scrum',
        'StartupIdeas',
        'Entrepreneurship',
        'TechTrends',

      ];
      setHashtags(trendingHashtags);
    };

    fetchTrendingHashtags();
  }, []);

  const handleCaptionChange = (e) => {
    const value = e.target.value;
    setCaption(value);

    // Detect if `#` is typed
    const lastWord = value.split(' ').pop();
    if (lastWord.startsWith('#')) {
      const query = lastWord.slice(1).toLowerCase();
      const matches = hashtags.filter((hashtag) =>
        hashtag.toLowerCase().includes(query)
      );
      setFilteredHashtags(matches);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleHashtagClick = (hashtag) => {
    const words = caption.split(' ');
    words.pop(); // Remove the last word (the one being typed)
    setCaption([...words, `#${hashtag}`].join(' ') + ' ');
    setShowSuggestions(false);
  };

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
    <div className="w-full max-w-md mx-auto p-4 bg-white rounded-2xl shadow-lg">
      <div className="flex justify-center mb-6">
        <AiOutlineCloudUpload size={32} color="#4e8bff" />
      </div>
      <div className="flex items-start space-x-3 mb-4">
        <div className="w-full">
          <textarea
            value={caption}
            onChange={handleCaptionChange}
            placeholder="Write a caption..."
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm text-gray-700 resize-none"
            rows={3}
          />
          {showSuggestions && (
            <ul className="bg-white border border-gray-300 rounded-lg shadow-md mt-2 max-h-32 overflow-y-auto">
              {filteredHashtags.map((hashtag, index) => (
                <li
                  key={index}
                  className="p-2 hover:bg-blue-100 cursor-pointer"
                  onClick={() => handleHashtagClick(hashtag)}
                >
                  #{hashtag}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Preview */}
      {previewUrl && (
        <div className="relative mb-4">
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
            <AiOutlineClose size={18} />
          </button>
        </div>
      )}

      {/* File Type Selection */}
      <div className="flex justify-between mb-6">
        <label className="flex items-center space-x-2 cursor-pointer text-blue-500 hover:text-blue-700">
          <FaCamera size={20} />
          <span className="text-sm">Photo</span>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
        <label className="flex items-center space-x-2 cursor-pointer text-blue-500 hover:text-blue-700">
          <FaFileVideo size={20} />
          <span className="text-sm">Video</span>
          <input
            type="file"
            accept="video/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
        <label className="flex items-center space-x-2 cursor-pointer text-blue-500 hover:text-blue-700">
          <FaFileAudio size={20} />
          <span className="text-sm">Audio</span>
          <input
            type="file"
            accept="audio/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
      </div>

      {/* Post Button */}
      <Button
        onClick={handleSubmit}
        disabled={isUploading}
        className="w-full"
      >
        {isUploading ? 'Posting...' : 'Post'}
      </Button>
    </div>
  );
};

export default UploadPost;
