import React, { useState, useEffect } from 'react';
import { FaCamera, FaFileVideo, FaFileAudio } from 'react-icons/fa';
import { AiOutlineClose, AiOutlineCloudUpload } from 'react-icons/ai';
import { getFirestore, collection, addDoc, getDocs, query, where } from 'firebase/firestore';
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
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [showUserSuggestions, setShowUserSuggestions] = useState(false);

  const auth = getAuth();
  const firestore = getFirestore();
  const realtimeDb = getDatabase();
  const storage = getStorage();

  // Fetch users from Firestore
  useEffect(() => {
    const fetchUsers = async () => {
      const usersRef = collection(firestore, 'users');
      const usersSnapshot = await getDocs(usersRef);
      const usersData = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setUsers(usersData);
    };

    fetchUsers();
  }, []);

  const handleCaptionChange = (e) => {
    const value = e.target.value;
    setCaption(value);

    const lastWord = value.split(' ').pop();
    if (lastWord.startsWith('@')) {
      const query = lastWord.slice(1).toLowerCase();
      const matches = users.filter(user =>
        user.username.toLowerCase().includes(query)
      );
      setFilteredUsers(matches);
      setShowUserSuggestions(true);
    } else {
      setShowUserSuggestions(false);
    }
  };

  const handleUserClick = (user) => {
    const words = caption.split(' ');
    words.pop();
    setCaption([...words, `@${user.username}`].join(' ') + ' ');
    setShowUserSuggestions(false);
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const type = selectedFile.type.split('/')[0];
      setFile(selectedFile);
      setFileType(type);
      setPreviewUrl(type === 'text' ? null : URL.createObjectURL(selectedFile));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!caption.trim() && !file) {
      alert('Caption or a file is required.');
      return;
    }

    setIsUploading(true);
    const user = auth.currentUser;

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

      // Save post in the logged-in user's Firestore
      const docRef = await addDoc(collection(firestore, `users/${user.uid}/posts`), newPost);
      const postId = docRef.id;

      // Save post in Realtime Database for feeds
      await set(ref(realtimeDb, 'feeds/' + postId), {
        ...newPost,
        username: user.displayName || user.email,
        id: postId,
      });

      // Identify mentioned users and create notifications
      const mentionedUsers = users.filter(user =>
        caption.includes(`@${user.username}`)
      );

      for (const mentionedUser of mentionedUsers) {
        const notificationMessage = `${user.displayName || user.email} mentioned you in a post: "${caption.slice(0, 30)}..."`; // Truncate caption for brevity
      
        await addDoc(collection(firestore, `users/${mentionedUser.id}/notifications`), {
          type: 'mention',
          postId,
          mentionedBy: user.displayName || user.email,
          timestamp: new Date().toISOString(),
          message: notificationMessage, // Add the notification message
          seen: false,
        });
      }
      

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
        <textarea
          value={caption}
          onChange={handleCaptionChange}
          placeholder="Write a caption... Mention users with @username"
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm text-gray-700 resize-none"
          rows={3}
        />
        {showUserSuggestions && (
          <ul className="bg-white border border-gray-300 rounded-lg shadow-md mt-2 max-h-32 overflow-y-auto">
            {filteredUsers.map(user => (
              <li
                key={user.id}
                className="p-2 hover:bg-blue-100 cursor-pointer"
                onClick={() => handleUserClick(user)}
              >
                @{user.username}
              </li>
            ))}
          </ul>
        )}
      </div>

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
