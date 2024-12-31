import React, { useState, useEffect } from 'react';
import { db, auth } from './firebaseConfig';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCog, faBell } from '@fortawesome/free-solid-svg-icons';
import { Link, useNavigate } from 'react-router-dom';

const Header = () => {
  const [user, setUser] = useState({
    displayName: '',
    avatar: '',
    username: '',
  });
  const [currentUserId, setCurrentUserId] = useState(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0); 
  const [unreadMessages, setUnreadMessages] = useState(0); 
  const [scrolling, setScrolling] = useState(false); 
  const [darkMode, setDarkMode] = useState(false); 
  const navigate = useNavigate();

  // Detect system theme preference on initial load
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    // Function to update the dark mode state based on the system preference
    const updateDarkMode = () => {
      setDarkMode(mediaQuery.matches);
    };

    // Set the initial dark mode state based on system preference
    updateDarkMode();

    // Listen for changes in system theme preference
    mediaQuery.addEventListener('change', updateDarkMode);

    // Cleanup the listener on component unmount
    return () => mediaQuery.removeEventListener('change', updateDarkMode);
  }, []);

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
            setUser({
              displayName: userData.fullName || 'User Profile',
              avatar: userData.avatar || 'profile.jpg',
              username: userData.username || '',
            });
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
    };

    const fetchUnreadNotifications = async () => {
      if (currentUserId) {
        const notificationsRef = collection(db, 'users', currentUserId, 'notifications');
        const q = query(notificationsRef, where('seen', '==', false));
        const querySnapshot = await getDocs(q);
        setUnreadNotifications(querySnapshot.size);
      }
    };

    const fetchUnreadMessages = async () => {
      if (currentUserId) {
        const messagesRef = collection(db, 'users', currentUserId, 'messages');
        const q = query(messagesRef, where('read', '==', false));
        const querySnapshot = await getDocs(q);
        setUnreadMessages(querySnapshot.size);
      }
    };

    fetchUserData();
    fetchUnreadNotifications();
    fetchUnreadMessages();
  }, [currentUserId]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolling(true);
      } else {
        setScrolling(false);
      }
    };

    window.addEventListener('scroll', handleScroll);

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNotificationClick = () => {
    navigate('/notifications');
    if (currentUserId) {
      const notificationsRef = collection(db, 'users', currentUserId, 'notifications');
      const q = query(notificationsRef, where('seen', '==', false));
      getDocs(q).then((querySnapshot) => {
        querySnapshot.forEach(async (doc) => {
          await updateDoc(doc.ref, { seen: true });
        });
        setUnreadNotifications(0);
      });
    }
  };

  const handleProfilePicClick = () => {
    navigate(`/profile/${user.username}`);
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 flex items-center justify-between px-6 py-3 z-50 ${scrolling ? 'shadow-md' : ''} ${
        darkMode ? 'bg-black text-white' : 'bg-transparent text-gray-800'
      }`}
    >
      <div className="flex items-center space-x-3">
        <Link to="/" className={`text-2xl font-bold tracking-wide ${darkMode ? 'text-white' : 'text-blue-600'}`}>
          Hii<span className="text-blue-500">Hive</span>
        </Link>
      </div>

      <div className="flex items-center space-x-4 ml-auto">
      <Link to="/settings" className={`block md:hidden ${darkMode ? 'text-white' : 'text-gray-700'} hover:text-gray-900`}>
  <FontAwesomeIcon icon={faCog} size="lg" />
</Link>


        <div className="relative">
          <FontAwesomeIcon
            icon={faBell}
            size="lg"
            className={`cursor-pointer ${darkMode ? 'text-white' : 'text-gray-700'} hover:text-gray-900`} 
            onClick={handleNotificationClick}
          />
          {(unreadNotifications > 0 || unreadMessages > 0) && (
            <span className="absolute top-0 right-0 inline-block w-4 h-4 text-xs font-semibold text-white bg-red-500 rounded-full flex items-center justify-center">
              {unreadMessages + unreadNotifications}
            </span>
          )}
        </div>

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
            <span className="text-base sm:text-lg font-semibold hidden sm:inline cursor-pointer">
              {user.username}
            </span>
          </Link>
        )}
      </div>
    </header>
  );
};

export default Header;
