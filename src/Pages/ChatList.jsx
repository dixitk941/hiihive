import React, { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebaseConfig'; // Import your Firebase config
import SidebarLeft from '../components/SidebarLeft';
import SidebarRight from '../components/SidebarRight';
import Feeds from '../components/ChatList';
// import FloatingMenu from '../components/FloatingMenu';
import ChatInterface from '../components/ChatInterface';
import BottomBar from '../components/BottomBar';

const ChatList = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedChat, setSelectedChat] = useState(null);
  const [loading, setLoading] = useState(true); // Manage loading state
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Check system preference
    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDarkMode(prefersDarkMode);

    // Update body class based on the theme
    document.body.classList.toggle('dark', prefersDarkMode);

    // Listener for theme change
    const handleThemeChange = (e) => {
      setIsDarkMode(e.matches);
      document.body.classList.toggle('dark', e.matches);
    };

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
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
          console.log('No such document!');
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleBackToSidebar = () => {
    setSelectedChat(null);
  };

  // if (loading) {
  //   return (
  //     <div className="flex justify-center items-center min-h-screen">
  //       <img src={loaderGif} alt="Loading..." />
  //     </div>
  //   );
  // }

  return (
    <div className={`flex flex-col min-h-screen ${isDarkMode ? 'bg-black text-white' : 'bg-white text-gray-900'}`}>
      <div className="flex flex-1 pt-24"> {/* Add padding-top to avoid being hidden by the header */}
        {/* SidebarLeft for main navigation */}
        <div className="hidden lg:block w-[250px]">
          <SidebarLeft currentUser={currentUser} /> {/* Pass currentUser to SidebarLeft */}
        </div>
        
        {/* Main content section with SearchBar and Feeds */}
        <main className="flex-1 p-4 overflow-auto">
          {/* <SearchBar currentUser={currentUser} /> Pass currentUser to SearchBar */}
          <Feeds currentUser={currentUser} /> {/* Pass currentUser to Feeds */}
        </main>

        {/* Conditionally render SidebarRight or ChatInterface */}
        <div className="hidden lg:flex flex-col w-96">
          {/* If no chat is selected, show SidebarRight */}
          {/* {!selectedChat ? (
            <SidebarRight currentUser={currentUser} setSelectedChat={setSelectedChat} /> 
          ) : (
            <ChatInterface currentUser={currentUser} chatRoomId={selectedChat} onBack={handleBackToSidebar} /> 
          )} */}
        </div>

        {/* Show ChatInterface on mobile if chat is selected */}
        {selectedChat && (
          <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white shadow-lg z-50 p-4">
            <ChatInterface currentUser={currentUser} chatRoomId={selectedChat} onBack={handleBackToSidebar} />
          </div>
        )}
      </div>

      {/* Floating menu for additional options */}
     

      {/* Bottom Bar for mobile */}
      <BottomBar currentUser={currentUser} /> {/* Pass currentUser to BottomBar */}
    </div>
  );
};

export default ChatList;
