import React, { useState, useEffect } from 'react';
import { db, auth } from './firebaseConfig';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCog, faBell } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.svg';
import { Link, useLocation } from 'react-router-dom';

const Header = () => {
  const [user, setUser] = useState({
    displayName: '',
    avatar: '',
    username: '',
  });
  const [currentUserId, setCurrentUserId] = useState(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0); // For general notifications
  const [unreadMessages, setUnreadMessages] = useState(0); // For unread messages
  const [scrolling, setScrolling] = useState(false); // For scroll detection
  const navigate = useNavigate();

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

  // Fetch user data and unread notifications count
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

    // Fetch unread notifications count (if any)
    const fetchUnreadNotifications = async () => {
      if (currentUserId) {
        const notificationsRef = collection(db, 'users', currentUserId, 'notifications');
        const q = query(notificationsRef, where('seen', '==', false));
        const querySnapshot = await getDocs(q);
        setUnreadNotifications(querySnapshot.size);
      }
    };

    // Fetch unread messages count (if any)
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

  // Handle scroll event to change header background
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

  // Handle notification icon click
  const handleNotificationClick = () => {
    navigate('/notifications');
    // Mark notifications as seen after navigating
    if (currentUserId) {
      const notificationsRef = collection(db, 'users', currentUserId, 'notifications');
      const q = query(notificationsRef, where('seen', '==', false));
      getDocs(q).then((querySnapshot) => {
        querySnapshot.forEach(async (doc) => {
          await updateDoc(doc.ref, { seen: true });
        });
        setUnreadNotifications(0); // Reset notifications count after reading
      });
    }
  };

  // Handle profile pic click to navigate to the user's profile page
  const handleProfilePicClick = () => {
    navigate(`/profile/${user.username}`); // Adjust the URL based on how your routing is set up
  };

  return (
    <header className={`fixed top-0 left-0 right-0 flex items-center justify-between px-6 py-3 z-50 ${scrolling ? 'bg-white shadow-md' : 'bg-transparent'}`}>
      {/* Logo and Text on the Left */}
      <div className="flex items-center space-x-3">
      <Link to="/">

<img src={logo} alt="Logo" className="w-12 h-12 sm:w-14 sm:h-14" />

</Link>        <h1 className="text-lg sm:text-2xl font-bold tracking-wide text-gray-800">
          Hii<span className="text-blue-500">Hive</span>
        </h1>
      </div>

      {/* Right Side (Profile Pic, Settings, Notification) */}
      <div className="flex items-center space-x-4 ml-auto">
        {/* Settings Icon (Hidden on Desktop) */}
        <Link to="/settings" className="block md:hidden text-gray-700 hover:text-gray-900">

          <FontAwesomeIcon icon={faCog} size="lg" />

        </Link>

        {/* Notification Bell */}
        <div className="relative">
          <FontAwesomeIcon
            icon={faBell}
            size="lg"
            className="cursor-pointer text-gray-700 hover:text-gray-900"
            onClick={handleNotificationClick}
          />
          {/* Display the unread messages count */}
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
