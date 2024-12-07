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
  const [fileType, setFileType] = useState(null); // To store file type (photo or video)

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

    if (selectedFile) {
      if (selectedFile.type.startsWith("video/")) {
        if (selectedFile.size / 1024 / 1024 > 15) {
          alert("Video file size exceeds the 15 MB limit.");
          return;
        }

        const videoElement = document.createElement("video");
        videoElement.src = URL.createObjectURL(selectedFile);
        videoElement.onloadedmetadata = () => {
          if (videoElement.duration > 15) {
            alert("Video duration exceeds 15 seconds.");
          } else {
            setFile(selectedFile);
            setFileType("video");
            const fileURL = URL.createObjectURL(selectedFile);
            setPreviewUrl(fileURL);
          }
        };
      } else if (selectedFile.type.startsWith("image/")) {
        setFile(selectedFile);
        setFileType("image");
        const fileURL = URL.createObjectURL(selectedFile);
        setPreviewUrl(fileURL);
      } else {
        alert("Please select a valid file (video or photo).");
      }
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
          type: fileType, // Store file type as "image" or "video"
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

        // Set a timeout to delete the story after 12 hours
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
        }, 12 * 60 * 60 * 1000); // 12 hours
      }
    );
  };

  const handleAddStory = () => {
    // Add your logic to handle adding a story here
    console.log("Story added!");
    setShowAddStory(false);
  };

  const openStory = (index) => {
    setActiveStoryIndex(index);
    setProgress(0);
  };

  const closeStory = () => {
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
            <button
              className="absolute top-4 right-4 text-white text-2xl"
              onClick={() => setShowAddStory(false)}
            >
              &times;
            </button>
            <div className="mb-4">
              {file && (
                <div className="w-full overflow-hidden rounded-lg border-4 border-white" style={{ aspectRatio: '9/16' }}>
                  {fileType === "video" ? (
                    <div className="aspect-w-9 aspect-h-16">
                      <video
                        src={previewUrl}
                        className="w-full h-full object-cover"
                        controls
                      />
                    </div>
                  ) : (
                    <div className="aspect-w-9 aspect-h-16">
                      <img
                        src={previewUrl}
                        alt="Story"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="flex flex-col space-y-4">
              <input
                type="text"
                placeholder="Add a caption..."
                className="w-full p-2 rounded-lg bg-gray-800 text-white"
              />
              <button
                className="w-full py-2 rounded-lg bg-blue-500 text-white font-semibold"
                onClick={handleAddStory}
              >
                Add to Story
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
              className="absolute top-0 right-0 px-4 py-2 text-white"
              onClick={closeStory}
            >
              <BsX size={24} />
            </button>
          </div>

          <div className="flex items-center justify-between w-full px-4 z-20">
            <button className="text-white" onClick={prevStory}>
              <BsChevronLeft size={32} />
            </button>

            <div className="relative w-full h-full overflow-hidden border-4 border-white rounded-xl">
              <div className="relative w-full h-full">
                {userStories[activeStoryIndex]?.type === "video" ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    muted={isMuted}
                    loop
                    onPlay={() => videoRef.current.play()}
                    onPause={() => videoRef.current.pause()}
                    className="object-cover w-full h-full"
                    src={userStories[activeStoryIndex].url}
                  />
                ) : (
                  <img
                    src={userStories[activeStoryIndex]?.url}
                    alt="Story Image"
                    className="object-cover w-full h-full"
                  />
                )}
              </div>
            </div>

            <button
              className="text-white"
              onClick={nextStory}
            >
              <BsChevronRight size={32} />
            </button>
          </div>

          <div className="absolute bottom-4 left-4">
            <button
              className="text-white text-xl"
              onClick={toggleMute}
            >
              {isMuted ? <BsVolumeMute /> : <BsVolumeUp />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Stories;
