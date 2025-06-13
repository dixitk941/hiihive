import React, { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';
import SidebarLeft from '../components/SidebarLeft';
import UserProfileComponent from '../components/UserProfile';
import BottomBar from '../components/BottomBar';
import loaderGif from '../assets/normload.gif';
import { useTheme } from '../context/ThemeContext'; // Import the theme context

const UserProfilePage = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  // Use theme context instead of local state and system preference
  const { isDarkMode } = useTheme();

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userRef);
          if (userDoc.exists()) {
            setCurrentUser({ ...user, ...userDoc.data() });
          } else {
            console.log('No user document found, using auth data only');
            setCurrentUser(user);
          }
        } catch (error) {
          console.error('Error fetching user document:', error);
          setCurrentUser(user); // Fallback to auth user data
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Replace themeClass with Tailwind dark mode classes
  // const themeClass = isDarkMode ? 'bg-black text-white' : 'bg-gray-50 text-black';

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-black">
        <div className="relative flex flex-col items-center">
          <div className="relative">
            <img src={loaderGif} alt="Loading..." className="w-16 h-16 opacity-80" />
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-600 rounded-full opacity-20 animate-pulse" />
          </div>
          <div className="mt-6 text-center">
            <p className="text-lg font-medium mb-2 text-gray-900 dark:text-white">Loading Profile</p>
            <p className="text-sm opacity-60 text-gray-600 dark:text-gray-400">Please wait while we fetch the profile...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-white transition-colors duration-300">
      {/* Desktop Layout */}
      <div className="hidden lg:flex">
        {/* SidebarLeft for main navigation - desktop only */}
        <div className="w-[280px] flex-shrink-0 h-screen sticky top-0">
          <SidebarLeft currentUser={currentUser} />
        </div>
        
        {/* Main content section - takes remaining space */}
        <main className="flex-1 min-h-screen overflow-auto">
          <div className="max-w-6xl mx-auto">
            <UserProfileComponent currentUser={currentUser} />
          </div>
        </main>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden">
        {/* Main content for mobile */}
        <main className="pb-20"> {/* Add bottom padding for BottomBar */}
          <UserProfileComponent currentUser={currentUser} />
        </main>

        {/* Bottom Bar for mobile navigation */}
        <div className="fixed bottom-0 left-0 right-0 z-50">
          <BottomBar currentUser={currentUser} />
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;