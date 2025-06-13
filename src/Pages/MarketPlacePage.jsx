import React, { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, getFirestore } from 'firebase/firestore';
import SidebarLeft from '../components/SidebarLeft';
import MarketPlace from '../components/MarketPlace';
import BottomBar from '../components/BottomBar';
import loaderGif from '../assets/normload.gif';

const MarketPlacePage = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Check for theme preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialDarkMode = savedTheme ? savedTheme === 'dark' : prefersDarkMode;
    
    setIsDarkMode(initialDarkMode);
    
    if (initialDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

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

  // Auth state management
  useEffect(() => {
    const auth = getAuth();
    const firestore = getFirestore();
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userRef = doc(firestore, 'users', user.uid);
          const userDoc = await getDoc(userRef);
          if (userDoc.exists()) {
            setCurrentUser({ ...user, ...userDoc.data() });
          } else {
            setCurrentUser(user);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setCurrentUser(user);
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-black transition-colors duration-300">
        <div className="text-center">
          <img src={loaderGif} alt="Loading..." className="w-16 h-16 mx-auto mb-4 rounded-lg" />
          <p className="text-gray-600 dark:text-gray-300 text-sm font-medium">Loading marketplace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-black transition-colors duration-300">
      <div className="flex flex-1">
        {/* SidebarLeft for desktop navigation */}
        <div className="hidden lg:block w-64 xl:w-72 shrink-0 pt-20">
          <div className="sticky top-20 h-[calc(100vh-5rem)] overflow-y-auto">
            <SidebarLeft currentUser={currentUser} />
          </div>
        </div>
        
        {/* Main content section with MarketPlace */}
        <main className="flex-1 pt-16 lg:pt-20 px-4 overflow-y-auto">
          <div className="max-w-6xl mx-auto pb-20">
            <MarketPlace />
          </div>
        </main>
      </div>

      {/* Bottom Bar for mobile */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-10">
        <BottomBar />
      </div>
    </div>
  );
};

export default MarketPlacePage;