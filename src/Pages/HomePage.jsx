import React, { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';
import SidebarLeft from '../components/SidebarLeft';
import Feeds from '../components/Feeds';
import ChatInterface from '../components/ChatInterface';
import BottomBar from '../components/BottomBar';
import loaderGif from '../assets/normload.gif';

const HomePage = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedChat, setSelectedChat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Check for saved theme preference or default to system preference
    const savedTheme = localStorage.getItem('theme');
    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialDarkMode = savedTheme ? savedTheme === 'dark' : prefersDarkMode;
    
    setIsDarkMode(initialDarkMode);
    
    // Update document class instead of body
    if (initialDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Listener for theme change
    const handleThemeChange = (e) => {
      if (!localStorage.getItem('theme')) {
        setIsDarkMode(e.matches);
        document.documentElement.classList.toggle('dark', e.matches);
      }
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
        try {
          const userRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userRef);
          if (userDoc.exists()) {
            setCurrentUser({ ...user, ...userDoc.data() });
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-black transition-colors duration-300">
        <div className="text-center">
          <img src={loaderGif} alt="Loading..." className="w-16 h-16 mx-auto mb-4 rounded-lg" />
          <p className="text-gray-600 dark:text-gray-300 text-sm font-medium">Loading your feed...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-black transition-colors duration-300">
      <div className="flex flex-1 pt-16 lg:pt-20">
        {/* SidebarLeft for main navigation */}
        <div className="hidden lg:block w-64 xl:w-72 border-r border-gray-200 dark:border-gray-800">
          <div className="fixed h-full w-64 xl:w-72 pt-4 bg-white dark:bg-black overflow-y-auto">
            <SidebarLeft currentUser={currentUser} />
          </div>
        </div>
        
        {/* Main content section with Feeds */}
        {!selectedChat && (
          <main className="flex-1 min-h-0 overflow-auto">
            <div className="max-w-2xl mx-auto px-4 py-6">
              <Feeds currentUser={currentUser} />
            </div>
          </main>
        )}

        {/* Chat Interface when chat is selected */}
        {selectedChat && (
          <main className="flex-1 min-h-0">
            <ChatInterface 
              currentUser={currentUser} 
              chatRoomId={selectedChat} 
              onBack={handleBackToSidebar} 
            />
          </main>
        )}
      </div>

      {/* Bottom Bar for mobile */}
      {!selectedChat && (
        <BottomBar />
      )}
    </div>
  );
};

export default HomePage;