import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebaseConfig';
import UsersList from '../components/UserList';
import { useTheme } from '../context/ThemeContext'; // Import the theme context

function UserList() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  // Use theme context to ensure dark mode is properly applied
  useTheme();

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
  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-black">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 border-8 border-gray-200 dark:border-gray-700 rounded-full"></div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 border-8 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          </div>
          <p className="text-gray-500 dark:text-gray-400">Loading users...</p>
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-black">
      {/* Main Content Area */}
      <main className="flex-1 transition-all duration-300 ease-in-out">
        {/* UsersList Component - This handles its own layout and styling */}
        <UsersList currentUser={currentUser} />
      </main>
    </div>
  );
}

export default UserList;