import React, { useState, useEffect, useCallback } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';
import Feeds from '../components/Feeds';
import ChatInterface from '../components/ChatInterface';

const HomePage = () => {  const [currentUser, setCurrentUser] = useState(null);
  const [selectedChat, setSelectedChat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Memoized theme change handler to prevent recreation on each render
  const handleThemeChange = useCallback((e) => {
    if (!localStorage.getItem('theme')) {
      setIsDarkMode(e.matches);
      document.documentElement.classList.toggle('dark', e.matches);
    }
  }, []);

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

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', handleThemeChange);

    return () => {
      mediaQuery.removeEventListener('change', handleThemeChange);
    };
  }, [handleThemeChange]);

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
  // Handle back action from chat interface
  const handleBackToSidebar = useCallback(() => {
    setSelectedChat(null);
  }, []);if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black transition-colors duration-300 p-4">
        <div className="max-w-3xl mx-auto">
          {/* Stories skeleton */}
          <div className="flex items-center gap-4 pb-4 overflow-x-auto scrollbar-hide">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex flex-col items-center animate-pulse">
                <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 mb-1 p-1 ring-2 ring-gray-300 dark:ring-gray-600"></div>
                <div className="w-12 h-2 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            ))}
          </div>
          
          {/* Posts skeleton */}
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm mb-4 overflow-hidden animate-pulse">
              <div className="p-4 flex items-center">
                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 mr-3"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                </div>
                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700"></div>
              </div>
              
              <div className="w-full aspect-square bg-gray-200 dark:bg-gray-700"></div>
              
              <div className="p-4">
                <div className="flex space-x-4 mb-3">
                  <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                  <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                  <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                </div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6 mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mt-3"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-black transition-colors duration-300">
      <div className="flex flex-1">
        {/* Main content section with Feeds */}
        {!selectedChat && (
          <main className="flex-1 min-h-0 overflow-auto">
            <div className="max-w-2xl mx-auto px-4 py-6">
              <MemoizedFeeds currentUser={currentUser} />
            </div>
          </main>
        )}

        {/* Chat Interface when chat is selected */}
        {selectedChat && (
          <main className="flex-1 min-h-0">
            <MemoizedChatInterface 
              currentUser={currentUser} 
              chatRoomId={selectedChat} 
              onBack={handleBackToSidebar} 
            />
          </main>
        )}
      </div>
    </div>
  );
};

// Memoized components to prevent unnecessary re-renders
const MemoizedFeeds = React.memo(Feeds);
const MemoizedChatInterface = React.memo(ChatInterface);

export default React.memo(HomePage);