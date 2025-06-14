import React, { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';
import ChatListPage from '../components/ChatList'; // Updated import name
import { useTheme } from '../context/ThemeContext'; // Import the theme context

const ChatList = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  // Use the theme context instead of local state and system preference detection
  const { isDarkMode } = useTheme();

  // User authentication and data fetching
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setCurrentUser({
              id: user.uid,
              uid: user.uid, // Keep both for compatibility
              email: user.email,
              displayName: user.displayName,
              photoURL: user.photoURL,
              ...userData
            });
          } else {
            // Fallback to Firebase Auth data if no Firestore document
            setCurrentUser({
              id: user.uid,
              uid: user.uid,
              email: user.email,
              displayName: user.displayName || 'User',
              photoURL: user.photoURL,
              fullName: user.displayName || 'User',
              username: user.email?.split('@')[0] || 'username',
              avatar: user.photoURL || null
            });
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          // Fallback on error
          setCurrentUser({
            id: user.uid,
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || 'User',
            photoURL: user.photoURL,
            fullName: user.displayName || 'User',
            username: user.email?.split('@')[0] || 'username',
            avatar: user.photoURL || null
          });
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);  // Loading state with skeleton loader
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black p-4">
        <div className="max-w-6xl mx-auto">
          {/* Header skeleton */}
          <div className="flex items-center justify-between p-4 mb-4 animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-40"></div>
            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700"></div>
          </div>
          
          {/* Search bar skeleton */}
          <div className="mb-6 animate-pulse">
            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-full w-full"></div>
          </div>
          
          {/* Chat list skeleton */}
          <div className="space-y-3 animate-pulse">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center p-4 bg-white dark:bg-gray-800 rounded-xl">
                <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 mr-3"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                </div>
                <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              </div>
            ))}
          </div>
          
          {/* Tab bar skeleton */}
          <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 p-2 animate-pulse">
            <div className="flex justify-around">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If no user is authenticated, show a message or redirect
  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-black">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Please sign in to view messages
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            You need to be authenticated to access your messages.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-black">
      {/* Main Content Area */}
      <main className="flex-1 transition-all duration-300 ease-in-out">
        {/* ChatListPage Component - This handles its own layout and styling */}
        <ChatListPage currentUser={currentUser} />
      </main>
    </div>
  );
};

export default ChatList;