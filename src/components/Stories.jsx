import React, { useState, useEffect, useRef } from 'react';
import { BsChevronLeft, BsChevronRight, BsX, BsVolumeMute, BsVolumeUp } from "react-icons/bs";
import { auth, db, storage, dbRealtime } from "./firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { 
  collection, 
  addDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp, 
  updateDoc, 
  arrayUnion, 
  arrayRemove, 
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
  const videoRef = useRef(null);
  const [file, setFile] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [previewUrl, setPreviewUrl] = useState("");
  const [isMuted, setIsMuted] = useState(false);

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
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
      const storiesRef = dbRef(dbRealtime, "stories");

      onValue(storiesRef, (snapshot) => {
        const storiesData = snapshot.val();
        if (storiesData) {
          const storiesArray = Object.values(storiesData);
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

    if (selectedFile && selectedFile.type.startsWith("video/")) {
      setFile(selectedFile);
      const fileURL = URL.createObjectURL(selectedFile);
      setPreviewUrl(fileURL);
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
        // console.error("Upload failed:", error);
      },
      async () => {
        const downloadURL = await getDownloadURL(storageRef);
        const storyId = `${currentUser.uid}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const storyData = {
          storyId: storyId,
          url: downloadURL,
          type: "video",
          avatar: avatarUrl,
          timestamp: serverTimestamp(),
        };

        const userDocRef = doc(db, "users", currentUser.uid);
        await updateDoc(userDocRef, {
          stories: arrayUnion({
            storyId: storyData.storyId,
            url: storyData.url,
            type: storyData.type,
            avatar: storyData.avatar,
          }),
        });

        await set(dbRef(dbRealtime, `stories/${storyId}`), storyData);

        setFile(null);
        setProgress(0);

        setTimeout(async () => {
          await updateDoc(userDocRef, {
            stories: arrayRemove({
              storyId: storyData.storyId,
              url: storyData.url,
              type: storyData.type,
              avatar: storyData.avatar,
            }),
          });
          await remove(dbRef(dbRealtime, `stories/${storyId}`));
          await deleteObject(storageRef);
        }, 12 * 60 * 60 * 1000);
      }
    );
  };

  const openStory = (index) => {
    setActiveStoryIndex(index);
    setProgress(0);
  };

  const closeStory = () => {
    // console.log("Close button clicked");
    setActiveStoryIndex(null);
  };

  const nextStory = () => {
    setActiveStoryIndex((prevIndex) => (prevIndex + 1) % userStories.length);
  };

  const prevStory = () => {
    setActiveStoryIndex((prevIndex) => (prevIndex - 1 + userStories.length) % userStories.length);
  };

  return (
    <div className="w-full p-4 bg-white">
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

      {showAddStory && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
          <div className="bg-black rounded-lg shadow-lg w-full max-w-md p-6 relative">
            <div className="mb-4">
              {file && (
                <div className="w-full h-72 overflow-hidden rounded-lg bg-gray-800">
                  <video
                    src={previewUrl}
                    className="w-full h-full object-cover"
                    controls
                  />
                </div>
              )}
            </div>

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

            {progress > 0 && (
              <div className="my-4">
                <progress value={progress} max="100" className="w-full bg-gray-700 rounded-full">
                  {progress}%
                </progress>
              </div>
            )}

            <div className="flex justify-between mt-4">
              <button
                onClick={handleUpload}
                disabled={progress > 0 && progress < 100}
                className="bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 disabled:opacity-50 transition"
              >
                Upload
              </button>

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

      {activeStoryIndex !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex flex-col items-center justify-center z-50">
          <div className="absolute top-0 left-0 w-full px-4 py-2 flex items-center justify-between z-10">
            <div className="relative w-full flex gap-1">
              {userStories.map((_, index) => (
                <div
                  key={index}
                  className="h-1 flex-1 bg-gray-500 rounded-full overflow-hidden"
                >
                  <div
                    className={`h-full ${
                      index === activeStoryIndex
                        ? "bg-white transition-all"
                        : index < activeStoryIndex
                        ? "bg-white"
                        : ""
                    }`}
                    style={{
                      width: index === activeStoryIndex ? `${progress}%` : "100%",
                    }}
                  ></div>
                </div>
              ))}
            </div>
            <span className="absolute left-4 text-white font-medium text-sm">
              {userStories[activeStoryIndex]?.username}
            </span>
            <button
              className="absolute top-4 right-4 text-white bg-gray-700 bg-opacity-70 hover:bg-opacity-100 rounded-full p-2 text-xl transition-all z-50"
              onClick={closeStory}
            >
              <BsX />
            </button>
          </div>

          <div className="relative w-full h-screen flex items-center justify-center">
            {userStories[activeStoryIndex]?.type === "video" ? (
              <video
                src={userStories[activeStoryIndex]?.url}
                className="w-full h-full object-contain"
                autoPlay
                muted={isMuted}
                ref={(video) => (videoRef.current = video)}
              />
            ) : (
              <img
                src={userStories[activeStoryIndex]?.url}
                alt={`${userStories[activeStoryIndex]?.username}'s story`}
                className="w-full h-full object-contain"
              />
            )}
          </div>

          <div className="absolute bottom-4 flex items-center justify-center gap-4 w-full px-4">
            <button
              className="bg-gray-800 bg-opacity-70 text-white rounded-full p-3 hover:bg-opacity-100 transition"
              onClick={prevStory}
            >
              <BsChevronLeft />
            </button>

            <button
              className="bg-gray-800 bg-opacity-70 text-white rounded-full p-3 hover:bg-opacity-100 transition"
              onClick={() => {
                const video = videoRef.current;
                if (video) video.currentTime = 0;
              }}
            >
              Replay
            </button>

            <button
              className="bg-gray-800 bg-opacity-70 text-white rounded-full p-3 hover:bg-opacity-100 transition"
              onClick={toggleMute}
            >
              {isMuted ? <BsVolumeMute /> : <BsVolumeUp />}
            </button>

            <button
              className="bg-gray-800 bg-opacity-70 text-white rounded-full p-3 hover:bg-opacity-100 transition"
              onClick={nextStory}
            >
              <BsChevronRight />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Stories;