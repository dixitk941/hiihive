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
  }, []);  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black p-4">
        <div className="max-w-4xl mx-auto">
          {/* Search bar skeleton */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm mb-6 animate-pulse">
            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-full w-full"></div>
          </div>
          
          {/* User list skeleton */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex items-center p-4 border-b border-gray-100 dark:border-gray-700 animate-pulse">
                <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 mr-4"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
                <div className="w-20 h-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              </div>
            ))}
          </div>
          
          {/* Load more skeleton */}
          <div className="flex justify-center mt-6 animate-pulse">
            <div className="w-32 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
          </div>
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