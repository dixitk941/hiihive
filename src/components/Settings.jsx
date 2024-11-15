import React, { useEffect, useState } from 'react';
import { FiEdit, FiLock, FiPower, FiUser, FiMail } from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from './firebaseConfig'; // Firebase setup
import { reauthenticateWithCredential, EmailAuthProvider, updatePassword, getAuth, signOut } from 'firebase/auth';
import loaderGif from '../assets/normload.gif'; // Adjust the path according to your project structure

const Settings = () => {
  const [user, setUser] = useState(null);
  const [isProfileEditMode, setIsProfileEditMode] = useState(false);
  const [isPasswordEditMode, setIsPasswordEditMode] = useState(false);
  const [fullName, setfullName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch user data from Firestore
    const fetchUserData = async () => {
      const userRef = doc(db, "users", auth.currentUser.uid); // assuming 'users' collection
      const docSnap = await getDoc(userRef);
      
      if (docSnap.exists()) {
        setUser(docSnap.data());
        setfullName(docSnap.data().fullName);
        setUsername(docSnap.data().username);
        setBio(docSnap.data().bio);
      } else {
        // console.log("No such document!");
      }
    };
    
    fetchUserData();
  }, []);

  const handleProfileUpdate = async () => {
    const userRef = doc(db, "users", auth.currentUser.uid);
    await updateDoc(userRef, {
      fullName,
      username,
      bio
    });
    setIsProfileEditMode(false); // Exit edit mode
  };

  const handlePasswordUpdate = async () => {
    if (newPassword !== confirmNewPassword) {
      alert("New password and confirmation do not match!");
      return;
    }

    try {
      const userCredential = EmailAuthProvider.credential(auth.currentUser.email, oldPassword);
      await reauthenticateWithCredential(auth.currentUser, userCredential);
      await updatePassword(auth.currentUser, newPassword);
      alert('Password updated successfully');
      setIsPasswordEditMode(false); // Exit password edit mode
    } catch (error) {
      // console.error("Error updating password", error);
      alert("Error updating password");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login'); // Redirect to login page after logout
    } catch (error) {
      // console.error('Error logging out:', error);
    }
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(true);
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  if (!user) {
    return (
      <div className="h-screen flex flex-col justify-center items-center bg-gray-100">
        {/* Loader GIF in the center */}
        <div className="flex items-center justify-center mb-4">
          <img src={loaderGif} alt="Loading" className="w-32 h-32" /> {/* Increased size */}
        </div>
      </div>
    );
  }


  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold">Settings</h2>
      </div>

      {/* Profile Settings Section */}
      <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
        <h3 className="text-xl font-medium mb-4">Profile</h3>
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-full bg-gray-300 flex items-center justify-center">
            {/* Profile Picture */}
            <img src={user.avatar || '/default-profile.jpg'} alt="Profile" className="w-full h-full rounded-full" />
          </div>
          <div>
            <h4 className="text-lg font-medium">{fullName}</h4>
            <p className="text-gray-600">@{username}</p>
            <button
              onClick={() => setIsProfileEditMode(!isProfileEditMode)}
              className="mt-2 text-blue-500 hover:underline flex items-center"
            >
              <FiEdit size={16} className="mr-2" />
              {isProfileEditMode ? 'Cancel' : 'Edit'}
            </button>
          </div>
        </div>
        {isProfileEditMode && (
          <div className="mt-4 space-y-4">
            <input
              type="text"
              value={fullName}
              onChange={(e) => setfullName(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg shadow-sm"
              placeholder="Name"
            />
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg shadow-sm"
              placeholder="Username"
            />
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg shadow-sm"
              placeholder="Bio"
            />
            <button onClick={handleProfileUpdate} className="mt-2 bg-blue-500 text-white px-6 py-2 rounded-lg">
              Save
            </button>
          </div>
        )}
      </div>

      {/* Account Settings Section */}
      <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
        <h3 className="text-xl font-medium mb-4">Account</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p>Email</p>
            <p className="text-gray-600">{user.email}</p>
          </div>
          <div className="flex items-center justify-between">
            <p>Password</p>
            <button
              onClick={() => setIsPasswordEditMode(!isPasswordEditMode)}
              className="text-blue-500 hover:underline flex items-center"
            >
              <FiLock size={16} className="mr-2" />
              {isPasswordEditMode ? 'Cancel' : 'Change'}
            </button>
          </div>
          {isPasswordEditMode && (
            <div className="mt-4 space-y-4">
              <input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="Current Password"
                className="w-full px-4 py-2 border rounded-lg shadow-sm"
              />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New Password"
                className="w-full px-4 py-2 border rounded-lg shadow-sm"
              />
              <input
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                placeholder="Confirm New Password"
                className="w-full px-4 py-2 border rounded-lg shadow-sm"
              />
              <button onClick={handlePasswordUpdate} className="mt-2 bg-blue-500 text-white px-6 py-2 rounded-lg">
                Save
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Log Out Section */}
      <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
        <div className="flex items-center justify-between">
          <button
            className="flex items-center text-red-500 hover:text-red-600"
            onClick={confirmLogout}
          >
            <FiPower size={20} className="mr-2" />
            Log out
          </button>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <p className="mb-4">Are you sure you want to log out?</p>
            <div className="flex justify-end">
              <button
                className="bg-red-500 text-white px-4 py-2 rounded mr-2"
                onClick={handleLogout}
              >
                Yes, log out
              </button>
              <button
                className="bg-gray-300 text-black px-4 py-2 rounded"
                onClick={cancelLogout}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )} {/* Enhanced Project Promotion Section */}
      <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
        <h3 className="text-xl font-medium mb-4">Explore More Apps</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { name: "AINOR", link: "https://ainor.vercel.app" },
            { name: "NeoCodeNex", link: "https://neocodenex.tech" },
            { name: "MentorConnect", link: "https://mentorconnectt.vercel.app" },
            { name: "GenZHub", link: "https://genzhub.vercel.app" },
            { name: "HiiHive", link: "https://hiiHive.vercel.app" }
          ].map((project, index) => (
            <a
              key={index}
              href={project.link}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-gradient-to-r from-blue-500 to-purple-600 p-4 rounded-lg shadow-lg text-white font-semibold hover:shadow-xl hover:scale-105 transition-transform duration-300"
            >
              {project.name}
            </a>
          ))}
        </div>
      </div>

      {/* Footer Section for Credit */}
      <footer className="text-center mt-8 text-sm text-gray-500">
        <p>Developed by dixitk941 | Powered by AINOR</p>
      </footer>
    </div>
  );
};

export default Settings;
