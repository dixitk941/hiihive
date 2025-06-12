import React, { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';
import Settings from '../components/Settings';
import BottomBar from '../components/BottomBar';
import SidebarLeft from '../components/SidebarLeft';

const SettingPage = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Check system preference and set dark mode
    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDarkMode(prefersDarkMode);
    document.body.classList.toggle('dark', prefersDarkMode);

    // Listen for theme changes
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
        try {
          const userRef = doc(db, 'users', user.uid);
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
      <div className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Sidebar Component - Will be positioned fixed internally */}
      <SidebarLeft currentUser={currentUser} />

      {/* Main Content - Properly spaced to account for sidebar */}
      <div className="lg:ml-72">
        {/* Settings Content */}
        <main className="min-h-screen pb-20 lg:pb-0">
          <Settings currentUser={currentUser} />
        </main>
      </div>

      {/* Bottom Bar for mobile only */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50">
        <BottomBar />
      </div>
    </div>
  );
};

export default SettingPage;