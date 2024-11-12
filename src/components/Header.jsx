import React, { useState, useEffect } from 'react';
import { db, auth, storage } from './firebaseConfig';  // Correct imports
import { doc, getDoc } from 'firebase/firestore';  // Firestore imports
import { onAuthStateChanged } from 'firebase/auth';  // Firebase authentication listener
import { getDownloadURL, ref } from "firebase/storage"; // Firebase storage imports
import logo from '../assets/logo.svg';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [user, setUser] = useState({
    displayName: '',
    avatar: '',
    username: '',
    age: '',
  });
  const [currentUserId, setCurrentUserId] = useState(null);

  // Listen to authentication state changes and get user ID
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUserId(user.uid);  // Store the authenticated user's ID
        console.log("User ID:", user.uid);
      } else {
        setCurrentUserId(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // Fetch user data from Firestore when user ID is available
  useEffect(() => {
    const fetchUserData = async () => {
      if (currentUserId) {
        const userRef = doc(db, 'users', currentUserId);
        console.log("Fetching data for user ID:", currentUserId);
        try {
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const userData = userSnap.data();
            console.log('User Data:', userData);  // Log user data

            // Fetch avatar URL from Firebase Storage
            let avatarUrl = 'profile.jpg'; // Default avatar
            if (userData.avatar) {
              const avatarRef = ref(storage, `avatars/${currentUserId}`);
              avatarUrl = await getDownloadURL(avatarRef);
              console.log("Avatar URL:", avatarUrl);
            }

            setUser({
              displayName: userData.fullName || 'User Profile',
              avatar: avatarUrl,
              username: userData.username || '',
              age: userData.age || '',
            });
          } else {
            console.log('No such document!');
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
    };
    fetchUserData();
  }, [currentUserId]);
  
  // Handle scroll effect for the header background
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 flex items-center justify-between px-8 py-5 bg-white shadow-md border-b border-gray-200 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-opacity-90 backdrop-blur-md' : ''
      }`}
    >
      <div className="flex items-center space-x-4">
        <img src={logo} alt="Logo" className="w-16 h-16" />
        <h1 className="text-3xl font-extrabold tracking-wide text-gray-800 animate-fadeIn">
          Hii<span className="text-blue-500">Hive</span>
        </h1>
      </div>
      <div className="flex items-center space-x-4">
        {user.avatar && <img src={user.avatar} alt="User Avatar" className="w-10 h-10 rounded-full" />}
        {user.username && <span className="text-lg font-semibold text-gray-800">{user.username}</span>}
      </div>
    </header>
  );
};

export default Header;
