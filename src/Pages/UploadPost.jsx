import React, { useState, useEffect, useRef } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, addDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';
import SidebarLeft from '../components/SidebarLeft';
import SidebarRight from '../components/SidebarRight';
import UploadPost from '../components/UploadPost';
import UploadHivee from '../components/UploadHivee';
import BottomBar from '../components/BottomBar';
import UploadPoll from '../components/UploadPoll';

const UploadPage = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarRightVisible, setIsSidebarRightVisible] = useState(false);
  const [uploadType, setUploadType] = useState('Post');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const sidebarRightRef = useRef(null);

  // Dark mode detection
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDarkMode(mediaQuery.matches);

    const handleChange = (e) => setIsDarkMode(e.matches);
    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

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
  }, []);

  const toggleSidebarRight = () => setIsSidebarRightVisible(!isSidebarRightVisible);

  // Close sidebar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarRightRef.current && !sidebarRightRef.current.contains(event.target)) {
        setIsSidebarRightVisible(false);
      }
    };

    if (isSidebarRightVisible) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSidebarRightVisible]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-screen ${
        isDarkMode ? 'bg-black' : 'bg-gray-50'
      }`}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Loading...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-screen transition-colors duration-300 ${
      isDarkMode ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'
    }`}>
      <div className="flex flex-1 pt-16 lg:pt-20">
        {/* SidebarLeft */}
        <div className={`hidden lg:block w-64 transition-colors duration-300 ${
          isDarkMode ? 'bg-black border-gray-800' : 'bg-white border-gray-200'
        } border-r`}>
          <SidebarLeft currentUser={currentUser} />
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto p-6">
            {/* Upload Type Selector */}
            <div className={`rounded-2xl p-2 mb-6 ${
              isDarkMode ? 'bg-gray-900' : 'bg-white'
            } shadow-sm border ${
              isDarkMode ? 'border-gray-800' : 'border-gray-200'
            }`}>
              <div className="grid grid-cols-3 gap-2">
                {['Post', 'Hivee', 'Poll'].map((type) => (
                  <button
                    key={type}
                    className={`py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-200 ${
                      uploadType === type
                        ? 'bg-blue-500 text-white shadow-md'
                        : isDarkMode
                          ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
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
              {uploadType === 'Hivee' && <UploadHivee currentUser={currentUser} />}
              {uploadType === 'Poll' && <UploadPoll currentUser={currentUser} />}
            </div>
          </div>
        </main>

        {/* SidebarRight Overlay */}
        {isSidebarRightVisible && (
          <>
            {/* Backdrop */}
            <div 
              className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
              onClick={() => setIsSidebarRightVisible(false)}
            />
            
            {/* Sidebar */}
            <div
              ref={sidebarRightRef}
              className={`lg:hidden fixed right-0 top-0 bottom-0 w-80 max-w-sm transition-colors duration-300 ${
                isDarkMode ? 'bg-black border-gray-800' : 'bg-white border-gray-200'
              } border-l shadow-xl z-50 transform transition-transform duration-300`}
            >
              <SidebarRight currentUser={currentUser} />
            </div>
          </>
        )}
      </div>

      {/* BottomBar */}
      <BottomBar toggleSidebarRight={toggleSidebarRight} />
    </div>
  );
};

export default UploadPage;