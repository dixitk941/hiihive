import React, { useState, useEffect } from "react";
import { BsChevronLeft, BsChevronRight, BsX } from "react-icons/bs";
import { auth, db, storage, dbRealtime } from "./firebaseConfig"; // Import Firebase modules
import { onAuthStateChanged } from "firebase/auth";
import { 
  collection, 
  addDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp, 
  updateDoc, 
  arrayUnion, 
  arrayRemove, // Correct import
  getDoc 
} from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { ref as dbRef, set, remove, onValue } from "firebase/database";

  const Stories = () => {
    const [currentUser, setCurrentUser] = useState(null);
    const [userStories, setUserStories] = useState([]);
    const [activeStoryIndex, setActiveStoryIndex] = useState(null);
    const [progress, setProgress] = useState(0);
    const [showAddStory, setShowAddStory] = useState(false);
    const [file, setFile] = useState(null);
    const [avatarUrl, setAvatarUrl] = useState("");
    const [loading, setLoading] = useState(true);
    // const [file, setFile] = useState(null);         // For the selected video file
    const [previewUrl, setPreviewUrl] = useState(""); // For the video preview URL

  
    useEffect(() => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
          setCurrentUser(user);
          // Fetch user avatar
          const avatarRef = ref(storage, `avatars/${user.uid}`);
          getDownloadURL(avatarRef).then((url) => setAvatarUrl(url));
        } else {
          setCurrentUser(null);
        }
      });
  
      return () => unsubscribe();
    }, []);
  
    useEffect(() => {
      if (currentUser) {
        // Fetch stories from Realtime Database
        const storiesRef = dbRef(dbRealtime, "stories");
  
        onValue(storiesRef, (snapshot) => {
          const storiesData = snapshot.val();
          if (storiesData) {
            const storiesArray = Object.values(storiesData); // Convert to an array
            setUserStories(storiesArray);
          } else {
            setUserStories([]);
          }
          setLoading(false);
        });
      }
    }, [currentUser]);
  
    const handleFileChange = (e) => {
      const selectedFile = e.target.files[0];
    
      // Check if a file is selected and if it is a video
      if (selectedFile && selectedFile.type.startsWith("video/")) {
        setFile(selectedFile);
    
        // Generate a preview URL for the video
        const fileURL = URL.createObjectURL(selectedFile);
        setPreviewUrl(fileURL);  // Update the state with the preview URL
      } else {
        alert("Please select a video file.");
      }
    };
    

    
  
    const handleUpload = async () => {
      if (!file) return;
    
      const storageRef = ref(storage, `stories/${currentUser.uid}/${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);
    
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setProgress(progress);
        },
        (error) => {
          console.error("Upload failed:", error);
        },
        async () => {
          const downloadURL = await getDownloadURL(storageRef);
          const storyId = `${currentUser.uid}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const storyData = {
            storyId: storyId, // Unique story ID
            url: downloadURL,
            type: "video", // or image based on file type
            avatar: avatarUrl, // Avatar for the user
            timestamp: serverTimestamp(), // Timestamp for the story
          };
    
          // 1. Upload Story to Firestore (add to the user's stories array)
          const userDocRef = doc(db, "users", currentUser.uid);
          await updateDoc(userDocRef, {
            stories: arrayUnion({
              storyId: storyData.storyId, // Ensure each story is uniquely identifiable
              url: storyData.url,
              type: storyData.type,
              avatar: storyData.avatar,
            }),
          });
    
          // 2. Upload Story to Realtime Database
          await set(dbRef(dbRealtime, `stories/${storyId}`), storyData);
    
          // Reset the file and progress
          setFile(null);
          setProgress(0);
    
          // Schedule removal of story after 12 hours
          setTimeout(async () => {
            await updateDoc(userDocRef, {
              stories: arrayRemove({
                storyId: storyData.storyId, // Ensure story is removed by its unique ID
                url: storyData.url,
                type: storyData.type,
                avatar: storyData.avatar,
              }),
            });
            await remove(dbRef(dbRealtime, `stories/${storyId}`));
            await deleteObject(storageRef);
          }, 12 * 60 * 60 * 1000); // Remove after 12 hours
        }
      );
    };
    
    
  
    const openStory = (index) => {
      setActiveStoryIndex(index);
      setProgress(0);
    };
  
    const closeStory = () => {
      setActiveStoryIndex(null);
      setProgress(0);
    };
  
    const nextStory = () => {
      setActiveStoryIndex((prevIndex) => (prevIndex + 1) % userStories.length);
    };
  
    const prevStory = () => {
      setActiveStoryIndex((prevIndex) => (prevIndex - 1 + userStories.length) % userStories.length);
    };
  
    return (
      <div className="w-full p-4 bg-white">
        {/* Story Icons */}
        <div className="flex overflow-x-scroll space-x-4 scrollbar-hide">
          {currentUser && (
            <div className="flex flex-col items-center cursor-pointer">
              <div
                className="w-16 h-16 rounded-full border-2 border-pink-500 p-1 bg-gradient-to-tr from-yellow-400 to-pink-500"
                onClick={() => setShowAddStory(true)}
              >
                <img
                  src={avatarUrl || "/default-avatar.png"}
                  alt="Add Story"
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
              <p className="text-sm mt-2 text-gray-700 truncate w-20 text-center">Add Story</p>
            </div>
          )}
  
          {userStories.map((story, index) => (
            <div
              key={index}
              className="flex flex-col items-center cursor-pointer"
              onClick={() => openStory(index)}
            >
              <div className="w-16 h-16 rounded-full border-2 border-pink-500 p-1 bg-gradient-to-tr from-yellow-400 to-pink-500">
                <img
                  src={story.avatar}
                  alt={story.username}
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
              <p className="text-sm mt-2 text-gray-700 truncate w-20 text-center">
                {story.username}
              </p>
            </div>
          ))}
        </div>
  
      {/* Add Story Modal */}
{showAddStory && (
  <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
    {/* Modal Background */}
    <div className="bg-black rounded-lg shadow-lg w-full max-w-md p-6 relative">
      
      {/* Video Preview Section */}
      <div className="mb-4">
        {file && (
          <div className="w-full h-72 overflow-hidden rounded-lg bg-gray-800">
            <video
              src={previewUrl} // This should be set when the file is selected
              className="w-full h-full object-cover"
              controls
            />
          </div>
        )}
      </div>

      {/* File Input */}
      {!file && (
        <div className="flex flex-col items-center justify-center space-y-4 mb-6">
          <input
            type="file"
            accept="video/*"
            onChange={handleFileChange}
            className="hidden"
            id="file-input"
          />
          <label
            htmlFor="file-input"
            className="bg-blue-500 text-white py-3 px-6 rounded-lg cursor-pointer hover:bg-blue-600 transition"
          >
            Choose Story
          </label>
        </div>
      )}

      {/* Progress Bar */}
      {progress > 0 && (
        <div className="my-4">
          <progress value={progress} max="100" className="w-full bg-gray-700 rounded-full">
            {progress}%
          </progress>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between mt-4">
        {/* Upload Button */}
        <button
          onClick={handleUpload}
          disabled={progress > 0 && progress < 100} // Disable while uploading
          className="bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 disabled:opacity-50 transition"
        >
          Upload
        </button>

        {/* Cancel Button */}
        <button
          onClick={() => setShowAddStory(false)}
          className="bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
)}

  
        {/* Story Modal */}
        {activeStoryIndex !== null && (
  <div className="fixed inset-0 bg-black bg-opacity-90 flex flex-col items-center justify-center z-50">
    <div className="w-full h-2 bg-gray-600 absolute top-0 left-0">
      <div
        className="h-full bg-pink-500 transition-all"
        style={{ width: `${progress}%` }}
      ></div>
    </div>

    <div className="relative max-w-lg w-full flex items-center justify-center px-4 py-8">
      {userStories[activeStoryIndex].type === "video" ? (
        <video
          src={userStories[activeStoryIndex].url}
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-auto rounded-lg shadow-lg"
          onEnded={nextStory} // Automatically go to next story
        />
      ) : (
        <img
          src={userStories[activeStoryIndex].url}
          alt={`${userStories[activeStoryIndex].username}'s story`}
          className="w-full h-auto rounded-lg shadow-lg"
        />
      )}
    </div>

    <button
      className="absolute top-4 right-4 text-white bg-gray-700 bg-opacity-70 hover:bg-opacity-100 rounded-full p-2 text-xl transition-all"
      onClick={closeStory}
    >
      <BsX />
    </button>

    {activeStoryIndex > 0 && (
      <button
        className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white text-3xl bg-gray-700 bg-opacity-50 hover:bg-opacity-100 rounded-full p-2"
        onClick={prevStory}
      >
        <BsChevronLeft />
      </button>
    )}
    {activeStoryIndex < userStories.length - 1 && (
      <button
        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white text-3xl bg-gray-700 bg-opacity-50 hover:bg-opacity-100 rounded-full p-2"
        onClick={nextStory}
      >
        <BsChevronRight />
      </button>
    )}
  </div>
)}

      </div>
    );
  };
  
  export default Stories;
  