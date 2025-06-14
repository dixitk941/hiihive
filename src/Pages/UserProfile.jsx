import React, { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';
import UserProfileComponent from '../components/UserProfile';
import { useTheme } from '../context/ThemeContext'; // Import the theme context

const UserProfilePage = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  // Just initialize theme context, no need to extract values
  useTheme();

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

    return () => unsubscribe();  }, []);
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-black">
        <div className="relative flex flex-col items-center">          <div className="relative w-16 h-16">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 border-8 border-gray-200 dark:border-gray-700 rounded-full"></div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 border-8 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
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
      {/* Main content section */}
      <main className="min-h-screen">
        <div className="max-w-6xl mx-auto">
          <UserProfileComponent currentUser={currentUser} />
        </div>
      </main>
    </div>
  );
};

export default UserProfilePage;