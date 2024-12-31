import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebaseConfig'; // Adjust the import path as necessary
import SidebarLeft from '../components/SidebarLeft';
import SidebarRight from '../components/SidebarRight';
import UsersList from '../components/UserList'; // Replace Feeds with UsersList
import ChatInterface from '../components/ChatInterface';
import BottomBar from '../components/BottomBar';
import loaderGif from '../assets/normload.gif'; // Adjust the path according to your project structure

function UserList() {
  const [selectedChat, setSelectedChat] = useState(null); // Manage selected chat
  const [currentUser, setCurrentUser] = useState(null); // Manage current user
  const [loading, setLoading] = useState(true); // Manage loading state
  const [isDarkMode, setIsDarkMode] = useState(false); // Manage dark mode state

  // Function to go back to SidebarRight
  const handleBackToSidebar = () => {
    setSelectedChat(null);
  };

  // Fetch current user data
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setCurrentUser({ id: user.uid, ...userSnap.data() });
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

  // Detect system theme preference
  useEffect(() => {
    const matchDarkMode = window.matchMedia('(prefers-color-scheme: dark)');
    const updateTheme = () => {
      setIsDarkMode(matchDarkMode.matches);
    };
    // Set the initial theme based on system preference
    updateTheme();

    // Listen for changes to system theme preference
    matchDarkMode.addEventListener('change', updateTheme);

    // Clean up event listener
    return () => {
      matchDarkMode.removeEventListener('change', updateTheme);
    };
  }, []);

  // Apply dark or light class to the body based on the system preference
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  return (
    <div className="flex flex-col h-screen">
      <div className="flex flex-1 pt-24"> {/* Add padding-top to avoid being hidden by the header */}
        {/* SidebarLeft for main navigation */}
        <div className="hidden lg:block w-[250px]">
          <SidebarLeft />
        </div>
        
        {/* Main content section with SearchBar and UsersList */}
        <main className="flex-1 p-4 overflow-auto">
          {/* <SearchBar /> */}
          {currentUser && <UsersList currentUser={currentUser} />} {/* Pass currentUser to UsersList */}
        </main>

        {/* Conditionally render SidebarRight or ChatInterface */}
        <div className="hidden lg:flex flex-col w-96">
          {/* If no chat is selected, show SidebarRight */}
          {/* {!selectedChat ? (
            <SidebarRight setSelectedChat={setSelectedChat} />
          ) : (
            <ChatInterface selectedChat={selectedChat} onBack={handleBackToSidebar} /> // Pass handleBackToSidebar to ChatInterface
          )} */}
        </div>

        {/* Show ChatInterface on mobile if chat is selected */}
        {selectedChat && (
          <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white shadow-lg z-50 p-4">
            <ChatInterface selectedChat={selectedChat} onBack={handleBackToSidebar} /> {/* Pass handleBackToSidebar */}
          </div>
        )}
      </div>

      {/* Floating menu for additional options */}
     

      {/* Bottom Bar for mobile */}
      <BottomBar /> {/* Use BottomBar for mobile */}
    </div>
  );
}

export default UserList;
