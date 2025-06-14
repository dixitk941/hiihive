import React, { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';
import Notifications from '../components/Notifications';

const NotificationPage = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

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
    return (      <div className="flex justify-center items-center h-screen bg-gray-50 dark:bg-black">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 border-8 border-gray-200 dark:border-gray-700 rounded-full"></div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 border-8 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-black">
      {/* Main Notifications Content */}
      <main className="flex-1 overflow-auto pt-16">
        <div className="max-w-4xl mx-auto">
          <Notifications currentUser={currentUser} />
        </div>
      </main>
    </div>
  );
};

export default NotificationPage;