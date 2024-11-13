import React, { useState, useEffect } from 'react';
import { db, auth, storage } from './firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { getDownloadURL, ref } from "firebase/storage";
import { Link } from 'react-router-dom'; // Import Link from react-router-dom
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUserId(user.uid);
      } else {
        setCurrentUserId(null);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      if (currentUserId) {
        const userRef = doc(db, 'users', currentUserId);
        try {
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const userData = userSnap.data();
            let avatarUrl = 'profile.jpg';
            if (userData.avatar) {
              const avatarRef = ref(storage, `avatars/${currentUserId}`);
              avatarUrl = await getDownloadURL(avatarRef);
            }
            setUser({
              displayName: userData.fullName || 'User Profile',
              avatar: avatarUrl,
              username: userData.username || '',
              age: userData.age || '',
            });
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
    };
    fetchUserData();
  }, [currentUserId]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
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
        <Link to="/"> {/* Wrap logo in a Link */}
          <img src={logo} alt="Logo" className="w-16 h-16" />
        </Link>
        <h1 className="text-3xl font-extrabold tracking-wide text-gray-800 animate-fadeIn">
          Hii<span className="text-blue-500">Hive</span>
        </h1>
      </div>
      <div className="flex items-center space-x-4">
        {user.avatar && <img src={user.avatar} alt="User Avatar" className="w-10 h-10 rounded-full" />}
        {user.username && <span className="text-lg font-semibold text-gray-800 hidden lg:inline">{user.username}</span>}
      </div>
    </header>
  );
};

export default Header;
