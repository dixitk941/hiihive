import React, { useState, useEffect } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db, storage } from "./firebaseConfig";
import HiiCard from "./HiiCard";
import MoreAppsSection from "./MoreAppsSection";
// import loaderGif from "../assets/normload.gif";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import Footer from "./Footer";
import { Link } from "react-router-dom";

const colleges = [
  "Rajiv Academy For Technology and Management, Mathura",
  "GLA University, Mathura",
  "GL Bajaj, Mathura",
];

const PopUp = ({ onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const hasSeenPopup = localStorage.getItem("hasSeenPopup");
    if (!hasSeenPopup) {
      setIsVisible(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem("hasSeenPopup", "true");
    setIsVisible(false);
    if (onClose) onClose();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 relative">
        <button
          onClick={handleClose}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 focus:outline-none"
        >
          &times;
        </button>

        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800">🔔 Update Notice 🔔</h2>
        </div>

        <div className="mt-4 text-center">
          <p className="text-gray-600">
            Please ensure you have added your college information to your profile! It’s important for personalized experiences and features.
          </p>
        </div>

        <div className="mt-6 text-center">
          <Link
            to="/settings"
            className="px-6 py-2 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600 transition font-bold"
          >
            Go to Settings
          </Link>
        </div>
      </div>
    </div>
  );
};

const Settings = () => {
  const [user, setUser] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState("/default-profile.jpg");
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [college, setCollege] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [popupVisible, setPopupVisible] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      const userRef = doc(db, "users", auth.currentUser.uid);
      const docSnap = await getDoc(userRef);

      if (docSnap.exists()) {
        const userData = docSnap.data();
        setUser(userData);
        setAvatarUrl(userData.avatar || "/default-profile.jpg");
        setUsername(userData.username);
        setFullName(userData.fullName);
        setBio(userData.bio);
        setCollege(userData.college || "");

        if (!userData.college) {
          setPopupVisible(true);
        }
      }
    };

    fetchUserData();
  }, []);

  const handleEditProfile = () => {
    setIsEditing(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    setLoading(true);

    let uploadedAvatarUrl = avatarUrl;

    if (avatarFile) {
      const avatarRef = ref(storage, `avatars/${auth.currentUser.uid}`);
      const snapshot = await uploadBytes(avatarRef, avatarFile);
      uploadedAvatarUrl = await getDownloadURL(snapshot.ref);
    }

    const userRef = doc(db, "users", auth.currentUser.uid);
    await updateDoc(userRef, {
      avatar: uploadedAvatarUrl,
      username,
      fullName,
      bio,
      college,
    });

    setLoading(false);
    setIsEditing(false);
  };

//   if (!user) {
//     return (
// <div className="h-screen flex flex-col justify-center items-center bg-white dark:bg-black">
// <div className="flex items-center justify-center mb-4">
//           <img src={loaderGif} alt="Loading" className="w-32 h-32" />
//         </div>
//       </div>
//     );
//   }

  return (
<div className="max-w-4xl mx-auto p-4 bg-white text-black dark:bg-black dark:text-white">
{popupVisible && <PopUp onClose={() => setPopupVisible(false)} />}

      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold">Settings</h2>
      </div>

      <div className="mb-6">
        <HiiCard
          avatarUrl={avatarUrl}
          username={username}
          fullName={fullName}
          bio={bio}
          userId={auth.currentUser.uid}
        />
      </div>

      {!isEditing ? (
        <div className="text-center mb-6">
          <button
            onClick={handleEditProfile}
            className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 dark:bg-blue-700 dark:hover:bg-blue-600"
            >
            Edit Profile
          </button>
        </div>
      ) : (
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-4">Edit Your Profile</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Avatar</label>
              <input
                type="file"
                onChange={handleFileChange}
                accept="image/*"
                className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-800 dark:text-white dark:border-gray-600"
                />
              {avatarUrl && (
                <img
                  src={avatarUrl}
                  alt="Avatar Preview"
                  className="mt-4 w-32 h-32 object-cover rounded-full mx-auto dark:border-2 dark:border-gray-600"
                  />
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-800 dark:text-white dark:border-gray-600"
                placeholder="Enter Username"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-800 dark:text-white dark:border-gray-600"
                placeholder="Enter Full Name"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-800 dark:text-white dark:border-gray-600"
                placeholder="Enter Bio"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">College</label>
              <select
                value={college}
                onChange={(e) => setCollege(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-800 dark:text-white dark:border-gray-600"
                >
                <option value="" disabled>
                  Select your college
                </option>
                {colleges.map((collegeName, index) => (
                  <option key={index} value={collegeName}>
                    {collegeName}
                  </option>
                ))}
              </select>
            </div>

            <div className="text-center">
              <button
                onClick={handleSaveProfile}
                className="px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 dark:bg-green-700 dark:hover:bg-green-600"
                disabled={loading}
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

<div className="bg-black p-6 rounded-lg shadow-sm mb-6 dark:bg-black dark:text-white">
        <MoreAppsSection />
      </div>

      <Footer />
    </div>
  );
};

export default Settings;
