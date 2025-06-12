import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebaseConfig';
import SidebarLeft from '../components/SidebarLeft';
import UsersList from '../components/UserList';
import BottomBar from '../components/BottomBar';
import loaderGif from '../assets/normload.gif';

function UserList() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Fetch current user data
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            setCurrentUser({ id: user.uid, ...userSnap.data() });
          } else {
            // Fallback to Firebase Auth data if no Firestore document
            setCurrentUser({
              id: user.uid,
              fullName: user.displayName || 'User',
              username: user.email?.split('@')[0] || 'username',
              avatar: user.photoURL || null,
              email: user.email
            });
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          // Fallback to Firebase Auth data on error
          setCurrentUser({
            id: user.uid,
            fullName: user.displayName || 'User',
            username: user.email?.split('@')[0] || 'username',
            avatar: user.photoURL || null,
            email: user.email
          });
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

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-black">
        <div className="flex flex-col items-center space-y-4">
          <img src={loaderGif} alt="Loading" className="w-16 h-16 opacity-75" />
          <p className="text-gray-500 dark:text-gray-400">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-black">
      {/* Main Layout */}
      <div className="flex flex-1">
        {/* Left Sidebar - Desktop Only */}
        <SidebarLeft currentUser={currentUser} />
        
        {/* Main Content Area */}
        <main 
          className={`
            flex-1 transition-all duration-300 ease-in-out
            ${/* Account for sidebar width on desktop */ ''}
            lg:ml-72
          `}
        >
          {/* UsersList Component - This handles its own layout and styling */}
          <UsersList currentUser={currentUser} />
        </main>
      </div>

      {/* Bottom Navigation - Mobile Only */}
      <BottomBar />
    </div>
  );
}

export default UserList;