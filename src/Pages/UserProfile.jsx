import React, { useState, useEffect, useRef } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebaseConfig'; // Import your Firebase config
import SidebarLeft from '../components/SidebarLeft';
import SidebarRight from '../components/SidebarRight';
import Feeds from '../components/UserProfile';
import ChatInterface from '../components/ChatInterface';
import BottomBar from '../components/BottomBar';
import loaderGif from '../assets/normload.gif'; // Adjust the path according to your project structure

const UserProfile = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedChat, setSelectedChat] = useState(null);
  const [loading, setLoading] = useState(true); // Manage loading state
  const [isSidebarRightVisible, setIsSidebarRightVisible] = useState(false); // Manage SidebarRight visibility
  const [isDarkMode, setIsDarkMode] = useState(false); // Dark theme state
  const sidebarRightRef = useRef(null);

  useEffect(() => {
    // Detect system theme and apply dark mode
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDarkMode(mediaQuery.matches);

    const handleThemeChange = (e) => {
      setIsDarkMode(e.matches);
    };

    mediaQuery.addEventListener('change', handleThemeChange);

    return () => {
      mediaQuery.removeEventListener('change', handleThemeChange);
    };
  }, []);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          setCurrentUser({ ...user, ...userDoc.data() });
        } else {
          console.error('No such document!');
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let timeout;
    const handleActivity = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        setIsSidebarRightVisible(false);
      }, 10000); // 10 seconds of inactivity
    };

    const handleClickOutside = (event) => {
      if (sidebarRightRef.current && !sidebarRightRef.current.contains(event.target)) {
        setIsSidebarRightVisible(false);
      }
    };

    if (isSidebarRightVisible) {
      document.addEventListener('mousemove', handleActivity);
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      clearTimeout(timeout);
      document.removeEventListener('mousemove', handleActivity);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSidebarRightVisible]);

  const handleBackToSidebar = () => {
    setSelectedChat(null);
  };

  const toggleSidebarRight = () => {
    setIsSidebarRightVisible(!isSidebarRightVisible);
  };

  // Apply dark or light theme classes
  const themeClass = isDarkMode ? 'bg-black text-white' : 'bg-white text-black';

  return (
    <div className={`flex flex-col min-h-screen ${themeClass}`}>
      {loading && (
        <div className="flex justify-center items-center absolute inset-0 bg-gray-800 bg-opacity-50">
          <img src={loaderGif} alt="Loading..." />
        </div>
      )}
      <div className="flex flex-1 pt-24 overflow-auto"> {/* Add overflow-auto for scrolling */}
        {/* SidebarLeft for main navigation */}
        <div className="hidden lg:block w-[250px]">
          <SidebarLeft currentUser={currentUser} /> {/* Pass currentUser to SidebarLeft */}
        </div>
        
        {/* Main content section without SearchBar and Stories */}
        {!selectedChat && (
          <main className="flex-1 p-4 overflow-auto">
            <Feeds currentUser={currentUser} /> {/* Pass currentUser to Feeds */}
          </main>
        )}

        {/* Show SidebarRight on mobile if isSidebarRightVisible is true */}
        {isSidebarRightVisible && (
          <div ref={sidebarRightRef} className="lg:hidden fixed bottom-0 left-0 right-0 bg-gray-900 text-white shadow-lg z-50 p-4">
            <SidebarRight currentUser={currentUser} setSelectedChat={setSelectedChat} />
          </div>
        )}
      </div>

      {/* Bottom Bar for mobile, visible only if no chat is selected */}
      {!selectedChat && (
        <BottomBar toggleSidebarRight={toggleSidebarRight} /> 
      )}
    </div>
  );
};

export default UserProfile;
