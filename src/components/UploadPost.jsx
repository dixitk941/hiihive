import React, { useState, useEffect, useRef } from 'react';
import { getFirestore, collection, addDoc, getDocs } from 'firebase/firestore';
import { getDatabase, ref, set } from 'firebase/database';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

const UploadPost = () => {
  const [file, setFile] = useState(null);
  const [caption, setCaption] = useState('');
  const [previewUrl, setPreviewUrl] = useState(null);
  const [fileType, setFileType] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [hashtags, setHashtags] = useState([]);
  const [filteredHashtags, setFilteredHashtags] = useState([]);  const [showSuggestions, setShowSuggestions] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // States for mentions functionality
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [showUserSuggestions, setShowUserSuggestions] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  
  const fileInputRefs = useRef([]);
  const textareaRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [caption]);

  // Fetch trending hashtags
  useEffect(() => {
    const fetchTrendingHashtags = async () => {
      const trendingHashtags = [
        'ReactJS', 'WebDevelopment', 'AI', 'HiiHiveLaunch', 'JavaScript',
        'TailwindCSS', 'OpenSource', 'CloudComputing', 'MVP', 'TrendingNow',
        'StartupLife', 'Innovation', 'DataScience', 'Coding', 'TechNews',
        'Design', 'Productivity', 'Crypto', 'Blockchain', 'MachineLearning',
        'UIUX', 'FullStack', 'FrontEnd', 'BackEnd', 'DevOps',
        'MobileDevelopment', 'CloudNative', 'OpenAI', 'ReactNative',
        'VueJS', 'Angular', 'NextJS', 'NodeJS', 'CyberSecurity',
        'Agile', 'Scrum', 'StartupIdeas', 'Entrepreneurship', 'TechTrends'
      ];
      setHashtags(trendingHashtags);
    };

    fetchTrendingHashtags();
  }, []);

  // Fetch users for mentions
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const firestore = getFirestore();
        const usersRef = collection(firestore, 'users');
        const usersSnapshot = await getDocs(usersRef);
        const usersData = usersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        console.log('Fetched users:', usersData); // Debug log
        setUsers(usersData);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers();
  }, []);

  const handleCaptionChange = (e) => {
    const value = e.target.value;
    const position = e.target.selectionStart;
    setCaption(value);
    setCursorPosition(position);

    // Find the word at the cursor position
    const textBeforeCursor = value.substring(0, position);
    const words = textBeforeCursor.split(/\s/);
    const currentWord = words[words.length - 1];

    console.log('Current word:', currentWord); // Debug log

    // Check for hashtag suggestions
    if (currentWord.startsWith('#') && currentWord.length > 1) {
      const query = currentWord.slice(1).toLowerCase();
      const matches = hashtags.filter((hashtag) =>
        hashtag.toLowerCase().includes(query)
      );
      console.log('Hashtag matches:', matches); // Debug log
      setFilteredHashtags(matches.slice(0, 5));
      setShowSuggestions(true);
      setShowUserSuggestions(false);
    } 
    // Check for mention suggestions
    else if (currentWord.startsWith('@') && currentWord.length > 1) {
      const query = currentWord.slice(1).toLowerCase();
      const matches = users.filter(user => {
        const username = user.username?.toLowerCase() || '';
        const displayName = user.displayName?.toLowerCase() || '';
        const email = user.email?.toLowerCase() || '';
        return username.includes(query) || displayName.includes(query) || email.includes(query);
      });
      console.log('User matches:', matches); // Debug log
      setFilteredUsers(matches.slice(0, 5));
      setShowUserSuggestions(true);
      setShowSuggestions(false);
    } 
    // Hide all suggestions
    else {
      setShowSuggestions(false);
      setShowUserSuggestions(false);
    }
  };

  const handleHashtagClick = (hashtag) => {
    const textBeforeCursor = caption.substring(0, cursorPosition);
    const textAfterCursor = caption.substring(cursorPosition);
    const words = textBeforeCursor.split(/\s/);
    words[words.length - 1] = `#${hashtag}`;
    const newText = words.join(' ') + ' ' + textAfterCursor;
    
    setCaption(newText);
    setShowSuggestions(false);
    
    setTimeout(() => {
      textareaRef.current?.focus();
      const newPosition = words.join(' ').length + 1;
      textareaRef.current?.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  const handleUserClick = (user) => {
    const textBeforeCursor = caption.substring(0, cursorPosition);
    const textAfterCursor = caption.substring(cursorPosition);
    const words = textBeforeCursor.split(/\s/);
    const username = user.username || user.displayName || user.email.split('@')[0];
    words[words.length - 1] = `@${username}`;
    const newText = words.join(' ') + ' ' + textAfterCursor;
    
    setCaption(newText);
    setShowUserSuggestions(false);
    
    setTimeout(() => {
      textareaRef.current?.focus();
      const newPosition = words.join(' ').length + 1;
      textareaRef.current?.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

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
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelection = (selectedFile) => {
    if (selectedFile) {
      setFile(selectedFile);
      setFileType(selectedFile.type);
      
      if (selectedFile.type.startsWith('image/') || selectedFile.type.startsWith('video/') || selectedFile.type.startsWith('audio/')) {
        setPreviewUrl(URL.createObjectURL(selectedFile));
      }
    }
  };

  const handleFileChange = (e, index) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      handleFileSelection(selectedFile);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!caption.trim() && !file) {
      alert('Caption or a file is required.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    
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
      let normalizedFileType = 'text'; // Default to text
      
      if (file) {
        setUploadProgress(30);
        const fileRef = storageRef(storage, `posts/${user.uid}/${Date.now()}_${file.name}`);
        await uploadBytes(fileRef, file);
        fileUrl = await getDownloadURL(fileRef);
        setUploadProgress(70);
        
        // Normalize file type to match what Feeds expects
        if (file.type.startsWith('image/')) {
          normalizedFileType = 'image';
        } else if (file.type.startsWith('video/')) {
          normalizedFileType = 'video';
        } else if (file.type.startsWith('audio/')) {
          normalizedFileType = 'audio';
        }
      }

      const newPost = {
        userId: user.uid,
        caption,
        fileUrl,
        fileType: normalizedFileType, // Use normalized file type
        timestamp: new Date().toISOString(),
        likes: {},
        comments: {},
        shareCount: 0,
      };

      setUploadProgress(90);
      const docRef = await addDoc(collection(firestore, `users/${user.uid}/posts`), newPost);
      const postId = docRef.id;

      await set(ref(realtimeDb, 'feeds/' + postId), {
        ...newPost,
        username: user.displayName || user.email,
        id: postId,
      });

      // Handle mentions - create notifications for mentioned users
      const mentionMatches = caption.match(/@(\w+)/g);
      if (mentionMatches) {
        for (const mention of mentionMatches) {
          const username = mention.slice(1); // Remove @
          const mentionedUser = users.find(u => 
            u.username === username || 
            u.displayName === username || 
            u.email.split('@')[0] === username
          );
          
          if (mentionedUser && mentionedUser.id !== user.uid) {
            const notificationMessage = `${user.displayName || user.email} mentioned you in a post: "${caption.slice(0, 50)}${caption.length > 50 ? '...' : ''}"`; 
          
            await addDoc(collection(firestore, `users/${mentionedUser.id}/notifications`), {
              type: 'mention',
              postId,
              mentionedBy: user.displayName || user.email,
              mentionedById: user.uid,
              timestamp: new Date().toISOString(),
              message: notificationMessage,
              seen: false,
              postCaption: caption,
              postFileUrl: fileUrl,
            });
          }
        }
      }

      setUploadProgress(100);
      
      // Reset form
      setFile(null);
      setCaption('');
      setPreviewUrl(null);
      setFileType('');
      
      // Success feedback
      setTimeout(() => {
        alert('Post uploaded successfully!');
        setUploadProgress(0);
        setIsUploading(false);
      }, 500);
      
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload post.');
      setIsUploading(false);
    }
  };

  const removeFile = () => {
    setFile(null);
    setPreviewUrl(null);
    setFileType('');
    // Clear all file inputs
    fileInputRefs.current.forEach(ref => {
      if (ref) ref.value = '';
    });
  };

  const mediaTypes = [
    {
      type: 'image/*',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      label: 'Photo',
      color: 'text-green-500'
    },
    {
      type: 'video/*',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      ),
      label: 'Video',
      color: 'text-purple-500'
    },
    {
      type: 'audio/*',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
      ),
      label: 'Audio',
      color: 'text-orange-500'
    }
  ];

  return (
    <div className="min-h-screen transition-colors duration-300 bg-gray-50 dark:bg-black">
      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
            Create Post
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Share your thoughts with the community
          </p>
        </div>

        {/* Main Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Caption Input */}
          <div className="relative rounded-3xl transition-all duration-200 border bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
            <textarea
              ref={textareaRef}
              value={caption}
              onChange={handleCaptionChange}
              onKeyUp={handleCaptionChange}
              onMouseUp={handleCaptionChange}
              placeholder="What's on your mind? Use # for hashtags and @ to mention users..."
              className="w-full p-6 rounded-3xl resize-none transition-all duration-200 bg-transparent text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none"
              rows={3}
              style={{ minHeight: '120px' }}
            />

            {/* Hashtag Suggestions */}
            {showSuggestions && filteredHashtags.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 rounded-2xl shadow-lg border z-10 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
                {filteredHashtags.map((hashtag, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleHashtagClick(hashtag)}
                    className="w-full text-left px-4 py-3 transition-colors first:rounded-t-2xl last:rounded-b-2xl hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                  >
                    <span className="text-blue-500">#</span>{hashtag}
                  </button>
                ))}
              </div>
            )}

            {/* User Mention Suggestions */}
            {showUserSuggestions && filteredUsers.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 rounded-2xl shadow-lg border z-10 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
                {filteredUsers.map((user, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleUserClick(user)}
                    className="w-full text-left px-4 py-3 transition-colors first:rounded-t-2xl last:rounded-b-2xl flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                  >
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                      {(user.displayName || user.username || user.email)[0].toUpperCase()}
                    </div>
                    <div>
                      <span className="text-blue-500">@</span>
                      <span>{user.username || user.displayName || user.email.split('@')[0]}</span>
                      {user.displayName && user.username && (
                        <span className="text-xs ml-2 text-gray-400 dark:text-gray-500">
                          {user.displayName}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* File Upload Area */}
          <div
            className={`relative rounded-3xl border-2 border-dashed transition-all duration-300 ${
              dragActive 
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10' 
                : 'border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {!previewUrl ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                  <svg className="w-8 h-8 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <p className="text-lg font-medium mb-2 text-gray-900 dark:text-white">
                  Drop files here or click to browse
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Support for images, videos, and audio files
                </p>
              </div>
            ) : (
              <div className="relative p-4">
                {/* Preview Content */}
                <div className="relative rounded-2xl overflow-hidden">
                  {fileType?.startsWith('image/') && (
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full h-64 object-cover"
                    />
                  )}
                  {fileType?.startsWith('video/') && (
                    <video
                      src={previewUrl}
                      controls
                      className="w-full h-64 object-cover"
                    />
                  )}
                  {fileType?.startsWith('audio/') && (
                    <div className="p-8 text-center bg-gray-100 dark:bg-gray-800">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-orange-500 flex items-center justify-center">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                      </div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {file?.name}
                      </p>
                      <audio src={previewUrl} controls className="w-full mt-4" />
                    </div>
                  )}
                </div>

                {/* Remove button */}
                <button
                  type="button"
                  onClick={removeFile}
                  className="absolute top-6 right-6 w-8 h-8 bg-black bg-opacity-60 text-white rounded-full flex items-center justify-center hover:bg-opacity-80 transition-all duration-200"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          {/* Media Type Buttons */}
          <div className="grid grid-cols-3 gap-3">
            {mediaTypes.map((media, index) => (
              <label
                key={index}
                className="relative flex flex-col items-center p-4 rounded-2xl cursor-pointer transition-all duration-200 border group bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <div className={`${media.color} mb-2 group-hover:scale-110 transition-transform duration-200`}>
                  {media.icon}
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {media.label}
                </span>
                <input
                  ref={el => fileInputRefs.current[index] = el}
                  type="file"
                  accept={media.type}
                  onChange={(e) => handleFileChange(e, index)}
                  className="hidden"
                />
              </label>
            ))}
          </div>

          {/* Upload Progress */}
          {isUploading && (
            <div className="rounded-2xl p-4 border bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  Uploading...
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {uploadProgress}%
                </span>
              </div>
              <div className="w-full rounded-full h-2 bg-gray-200 dark:bg-gray-800">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isUploading || (!caption.trim() && !file)}
            className={`w-full py-4 px-6 rounded-2xl font-semibold text-lg transition-all duration-200 ${
              isUploading || (!caption.trim() && !file)
                ? 'bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                : 'bg-blue-500 text-white hover:bg-blue-600 active:scale-95 shadow-lg shadow-blue-500/25'
            }`}
          >
            {isUploading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Posting...</span>
              </div>
            ): (
              'Share Post'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UploadPost;