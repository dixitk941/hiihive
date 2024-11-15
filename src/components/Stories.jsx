import React, { useState, useEffect } from "react";
import { BsChevronLeft, BsChevronRight, BsX } from "react-icons/bs";
import { auth, db, storage } from "./firebaseConfig"; // Import Firebase modules
import { onAuthStateChanged } from "firebase/auth";
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  onSnapshot, 
  deleteDoc, 
  doc, 
  serverTimestamp // Correct import
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const Stories = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userStories, setUserStories] = useState([]);
  const [activeStoryIndex, setActiveStoryIndex] = useState(null);
  const [progress, setProgress] = useState(0);
  const [showAddStory, setShowAddStory] = useState(false);
  const [file, setFile] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState("");

  const progressInterval = 100;

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

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    const storageRef = ref(storage, `stories/${currentUser.uid}/${file.name}`);
    const uploadTask = uploadBytes(storageRef, file);

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
        await addDoc(collection(db, "stories"), {
          userId: currentUser.uid,
          url: downloadURL,
          type: file.type.startsWith("image/") ? "image" : "video",
          timestamp: serverTimestamp(),
        });
        setFile(null);
        setProgress(0);
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
    if (activeStoryIndex < userStories.length - 1) {
      setActiveStoryIndex((prev) => prev + 1);
      setProgress(0);
    } else {
      closeStory();
    }
  };

  const prevStory = () => {
    if (activeStoryIndex > 0) {
      setActiveStoryIndex((prev) => prev - 1);
      setProgress(0);
    }
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
            key={story.id}
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
        <div className="fixed inset-0 bg-black bg-opacity-90 flex flex-col items-center justify-center z-50">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="text-white p-4"
          />
          <button
            onClick={handleUpload}
            className="mt-4 bg-red-500 text-white py-2 px-4 rounded"
          >
            Upload
          </button>
          <progress value={progress} max="100" />
          <button
            onClick={() => setShowAddStory(false)}
            className="mt-4 bg-red-500 text-white py-2 px-4 rounded"
          >
            Cancel
          </button>
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
            <img
              src={userStories[activeStoryIndex].story}
              alt={`${userStories[activeStoryIndex].username}'s story`}
              className="w-full h-auto rounded-lg shadow-lg"
            />
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
