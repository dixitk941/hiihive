import React, { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';
import UploadPost from '../components/UploadPost';
// import UploadHivee from '../components/UploadHivee';
import UploadPoll from '../components/UploadPoll';

const UploadPage = () => {  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadType, setUploadType] = useState('Post');

  // Authentication state management
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
  }, []);  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black p-4">
        <div className="max-w-2xl mx-auto">
          {/* Header skeleton */}
          <div className="flex items-center justify-between mb-6 animate-pulse">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-40"></div>
            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700"></div>
          </div>
          
          {/* Upload type selector skeleton */}
          <div className="rounded-2xl p-2 mb-6 bg-white dark:bg-gray-900 shadow-sm animate-pulse">
            <div className="grid grid-cols-3 gap-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
              ))}
            </div>
          </div>
          
          {/* Upload form skeleton */}
          <div className="rounded-2xl p-6 bg-white dark:bg-gray-900 shadow-sm animate-pulse">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 mr-3"></div>
              <div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
              </div>
            </div>
            
            <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl mb-4"></div>
            
            <div className="flex justify-between items-center">
              <div className="flex space-x-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                ))}
              </div>
              <div className="w-24 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }  return (
    <div className="flex flex-col h-screen transition-colors duration-300 bg-gray-50 dark:bg-black text-gray-900 dark:text-white">
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pt-16">
        <div className="max-w-2xl mx-auto p-6">
          {/* Upload Type Selector */}
          <div className="rounded-2xl p-2 mb-6 bg-white dark:bg-gray-900 shadow-sm border border-gray-200 dark:border-gray-800">
            <div className="grid grid-cols-2 gap-2">
              {['Post', 'Poll'].map((type) => (
                <button
                  key={type}
                  className={`py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-200 ${
                    uploadType === type
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                  onClick={() => setUploadType(type)}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Upload Component */}
          <div className="transition-opacity duration-300">
            {uploadType === 'Post' && <UploadPost currentUser={currentUser} />}
            {/* {uploadType === 'Hivee' && <UploadHivee currentUser={currentUser} />} */}
            {uploadType === 'Poll' && <UploadPoll currentUser={currentUser} />}
          </div>
        </div>
      </main>
    </div>
  );
};

export default UploadPage;