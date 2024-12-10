import React, { useState, useEffect } from 'react';
import { db, auth, storage } from './firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { getDownloadURL, ref } from 'firebase/storage';
import { Link, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faBook, faCog } from '@fortawesome/free-solid-svg-icons';
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

  const location = useLocation();

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
      className={`fixed top-0 left-0 right-0 flex items-center justify-between px-3 sm:px-6 py-2 sm:py-3 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white bg-opacity-80 backdrop-blur-md shadow-md border-b border-gray-200'
          : 'bg-transparent'
      }`}
    >
      <div className="flex items-center space-x-3">
        <Link to="/">
          <img src={logo} alt="Logo" className="w-12 h-12 sm:w-14 sm:h-14" />
        </Link>
        <h1 className="text-lg sm:text-2xl font-bold tracking-wide text-gray-800 animate-fadeIn">
          Hii<span className="text-blue-500">Hive</span>
        </h1>
      </div>

      {/* Navigation Links */}

    

      {/* User Info */}
      <div className="flex items-center space-x-3">
        <Link to="/settings" className="block md:hidden text-gray-700 hover:text-gray-900">
          <FontAwesomeIcon icon={faCog} size="lg" />
        </Link>
        {user.avatar && (
          <Link to={`/user/${currentUserId}`}>
            <img
              src={user.avatar}
              alt="User Avatar"
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full cursor-pointer"
            />
          </Link>
        )}
        {user.username && (
          <Link to={`/user/${currentUserId}`}>
            <span className="text-base sm:text-lg font-semibold text-gray-800 hidden sm:inline cursor-pointer">
              {user.username}
            </span>
          </Link>
        )}
      </div>
    </header>
  );
};

export default Header;
