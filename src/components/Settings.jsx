import React, { useState, useEffect } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db, storage } from "./firebaseConfig"; // Firebase setup
import HiiCard from "./HiiCard"; // Import the HiiCard component
import MoreAppsSection from "./MoreAppsSection"; // Import MoreAppsSection component
import loaderGif from "../assets/normload.gif"; // Adjust the path according to your project structure
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"; // Firebase Storage functions
import Footer from "./Footer"; // Import the Footer component

const Settings = () => {
  const [user, setUser] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null); // For storing the selected file
  const [avatarUrl, setAvatarUrl] = useState("/default-profile.jpg");
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      const userRef = doc(db, "users", auth.currentUser.uid); // assuming 'users' collection
      const docSnap = await getDoc(userRef);

      if (docSnap.exists()) {
        const userData = docSnap.data();
        setUser(userData);
        setAvatarUrl(userData.avatar || "/default-profile.jpg");
        setUsername(userData.username);
        setFullName(userData.fullName);
        setBio(userData.bio);
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
        setAvatarUrl(reader.result); // Show the preview of the selected image
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
      uploadedAvatarUrl = await getDownloadURL(snapshot.ref); // Get the download URL after upload
    }

    const userRef = doc(db, "users", auth.currentUser.uid);
    await updateDoc(userRef, {
      avatar: uploadedAvatarUrl,
      username,
      fullName,
      bio,
    });

    setLoading(false);
    setIsEditing(false); // Close editing mode after saving
  };

  if (!user) {
    return (
      <div className="h-screen flex flex-col justify-center items-center bg-white">
        <div className="flex items-center justify-center mb-4">
          <img src={loaderGif} alt="Loading" className="w-32 h-32" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 bg-white text-black">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold">Settings</h2>
      </div>

      {/* HiiCard Section */}
      <div className="mb-6">
        <HiiCard
          avatarUrl={avatarUrl}
          username={username}
          fullName={fullName}
          bio={bio}
        />
      </div>

      {/* Edit Profile Button */}
      {!isEditing ? (
        <div className="text-center mb-6">
          <button
            onClick={handleEditProfile}
            className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Edit Profile
          </button>
        </div>
      ) : (
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-4">Edit Your Profile</h3>
          <div className="space-y-4">
            {/* Avatar File Upload */}
            <div>
              <label className="block text-sm font-semibold mb-2">Avatar</label>
              <input
                type="file"
                onChange={handleFileChange}
                accept="image/*"
                className="w-full p-2 border border-gray-300 rounded-md"
              />
              {avatarUrl && (
                <img
                  src={avatarUrl}
                  alt="Avatar Preview"
                  className="mt-4 w-32 h-32 object-cover rounded-full mx-auto"
                />
              )}
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-semibold mb-2">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="Enter Username"
              />
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-sm font-semibold mb-2">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="Enter Full Name"
              />
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-semibold mb-2">Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="Enter Bio"
              />
            </div>

            {/* Save Button */}
            <div className="text-center">
              <button
                onClick={handleSaveProfile}
                className="px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                disabled={loading}
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* More Apps Section */}
      <div className="bg-gray-100 p-6 rounded-lg shadow-sm mb-6">
        <MoreAppsSection />
      </div>

      {/* Footer Section */}
      <Footer />
    </div>
  );
};

export default Settings;
