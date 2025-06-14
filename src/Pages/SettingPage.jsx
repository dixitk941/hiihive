import React, { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';
import Settings from '../components/Settings';
import { useTheme } from '../context/ThemeContext'; // Import the theme context

const SettingPage = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  // Access theme context to ensure dark mode is properly applied
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
      <div className="min-h-screen bg-gray-50 dark:bg-black p-4">
        <div className="max-w-4xl mx-auto">
          {/* Settings header skeleton */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm mb-6 animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-64"></div>
          </div>
          
          {/* Settings tabs skeleton */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden mb-6 animate-pulse">
            <div className="flex border-b border-gray-200 dark:border-gray-700">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex-1 py-4 px-2">
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-20 mx-auto"></div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Settings form skeleton */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm animate-pulse">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="mb-6">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2"></div>
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            ))}
            
            <div className="flex gap-4 mt-8">
              <div className="w-32 h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="w-32 h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-white transition-colors duration-300">
      {/* Settings Content */}
      <main className="min-h-screen pb-20">
        <Settings currentUser={currentUser} />
      </main>
    </div>
  );
};

export default SettingPage;