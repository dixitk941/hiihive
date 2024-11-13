import React, { useState } from 'react';
import { FaCamera } from 'react-icons/fa';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { getDatabase, ref, set } from 'firebase/database';  // Use `set()` instead of `push()`
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

const UploadPost = () => {
  const [image, setImage] = useState(null);
  const [caption, setCaption] = useState('');
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!image || !caption) {
      alert('Please select an image and enter a caption.');
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
      // Upload image to Firebase Storage
      const imageRef = storageRef(storage, `posts/${user.uid}/${image.name}`);
      await uploadBytes(imageRef, image);
      const imageUrl = await getDownloadURL(imageRef);

      // Create post object with extra fields like likes, comments, and shareCount
      const newPost = {
        userId: user.uid,
        caption,
        imageUrl,
        timestamp: new Date().toISOString(),
        likes: 0,           // Likes count
        comments: [],       // Comments array
        shareCount: 0,      // Share count
        likesList: [],      // List of userIds who liked the post
        commentsList: [],   // List of comments (could be objects with userId and text)
      };

      // Save to Firestore under the current user's profile
      const docRef = await addDoc(collection(firestore, `users/${user.uid}/posts`), newPost);
      const postId = docRef.id;  // Get the unique Firestore document ID

      // Save to Realtime Database using `set()` with the Firestore-generated ID
      await set(ref(realtimeDb, 'feeds/' + postId), {
        ...newPost,
        username: user.displayName || user.email,
        id: postId,  // Store the post's Firestore document ID for reference
      });

      // Clear the form and preview
      setImage(null);
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
      {/* Header */}
      <h2 className="text-lg font-semibold text-gray-800 mb-4">New Post</h2>
      
      {/* Image Upload Section */}
      <div className="mb-4">
        {previewUrl ? (
          <img
            src={previewUrl}
            alt="Preview"
            className="w-full h-64 object-cover rounded-lg"
          />
        ) : (
          <div className="flex justify-center items-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer hover:border-gray-400">
            <label className="cursor-pointer text-gray-500 flex flex-col items-center">
              <FaCamera size={48} />
              <span>Select Image</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
          </div>
        )}
      </div>

      {/* Caption Input */}
      <textarea
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        placeholder="Write a caption..."
        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 mb-4"
        rows={3}
      />

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg font-semibold transition duration-200"
        disabled={isUploading}
      >
        {isUploading ? 'Uploading...' : 'Post'}
      </button>
    </div>
  );
};

export default UploadPost;
