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

    return () => unsubscribe();  }, []);  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black p-4">
        <div className="max-w-4xl mx-auto">
          {/* Profile header skeleton */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm mb-6">
            <div className="flex flex-col md:flex-row items-center animate-pulse">
              <div className="w-32 h-32 rounded-full bg-gray-200 dark:bg-gray-700 mb-6 md:mb-0 md:mr-8"></div>
              
              <div className="flex-1 w-full text-center md:text-left">
                <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-4 mx-auto md:mx-0"></div>
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-40 mb-4 mx-auto md:mx-0"></div>
                
                <div className="flex flex-wrap justify-center md:justify-start gap-3 mb-4">
                  <div className="h-9 bg-gray-200 dark:bg-gray-700 rounded-full w-28"></div>
                  <div className="h-9 bg-gray-200 dark:bg-gray-700 rounded-full w-28"></div>
                </div>
                
                <div className="flex justify-center md:justify-start space-x-6 mb-4">
                  <div className="text-center">
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-10 mx-auto mb-1"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                  </div>
                  <div className="text-center">
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-10 mx-auto mb-1"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                  </div>
                  <div className="text-center">
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-10 mx-auto mb-1"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Profile tabs skeleton */}
          <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden mb-6">
            <div className="flex border-b border-gray-200 dark:border-gray-700 animate-pulse">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex-1 py-4 px-2">
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-20 mx-auto"></div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Profile content skeleton - Grid of posts */}
          <div className="grid grid-cols-3 gap-2 md:gap-4 animate-pulse">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            ))}
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