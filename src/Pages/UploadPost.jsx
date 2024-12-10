import React, { useState, useEffect, useRef } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebaseConfig'; // Import your Firebase config
import SidebarLeft from '../components/SidebarLeft';
import SidebarRight from '../components/SidebarRight';
import UploadPost from '../components/UploadPost'; // Import UploadPost component
import UploadHivee from '../components/UploadHivee'; // Import UploadHivee component
import ChatInterface from '../components/ChatInterface';
import BottomBar from '../components/BottomBar';
import loaderGif from '../assets/normload.gif'; // Adjust the path according to your project structure

const UploadPage = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedChat, setSelectedChat] = useState(null);
  const [loading, setLoading] = useState(true); // Manage loading state
  const [isSidebarRightVisible, setIsSidebarRightVisible] = useState(false); // Manage SidebarRight visibility
  const [uploadType, setUploadType] = useState('Post'); // Default to 'Post' upload type
  const sidebarRightRef = useRef(null);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          setCurrentUser({ ...user, ...userDoc.data() });
        } else {
          console.log('No such document!');
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Effect to handle sidebar behavior on inactivity
  useEffect(() => {
    let timeout;
    const handleActivity = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        setIsSidebarRightVisible(false);
      }, 10000); // 10 seconds of inactivity
    };

    const handleClickOutside = (event) => {
      if (sidebarRightRef.current && !sidebarRightRef.current.contains(event.target)) {
        setIsSidebarRightVisible(false);
      }
    };

    if (isSidebarRightVisible) {
      document.addEventListener('mousemove', handleActivity);
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      clearTimeout(timeout);
      document.removeEventListener('mousemove', handleActivity);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSidebarRightVisible]);

  const handleBackToSidebar = () => {
    setSelectedChat(null);
  };

  const toggleSidebarRight = () => {
    setIsSidebarRightVisible(!isSidebarRightVisible);
  };

  const handleUploadTypeChange = (type) => {
    setUploadType(type);
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col justify-center items-center bg-gray-100">
        {/* Loader GIF in the center */}
        <div className="flex items-center justify-center mb-4">
          <img src={loaderGif} alt="Loading" className="w-32 h-32" /> {/* Increased size */}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="flex flex-1 pt-24"> {/* Add padding-top to avoid being hidden by the header */}
        {/* SidebarLeft for main navigation */}
        <div className="hidden lg:block w-[250px]">
          <SidebarLeft currentUser={currentUser} /> {/* Pass currentUser to SidebarLeft */}
        </div>

        {/* Main content section with posts (Upload Post/Hivee) */}
        {!selectedChat && (
          <main className="flex-1 p-4 overflow-auto">
            {/* Tab-like buttons to toggle between Post and Hivee */}
            <div className="flex mb-4">
              <button
                className={`flex-1 p-2 text-center ${uploadType === 'Post' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                onClick={() => handleUploadTypeChange('Post')}
              >
                Post
              </button>
              <button
                className={`flex-1 p-2 text-center ${uploadType === 'Hivee' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                onClick={() => handleUploadTypeChange('Hivee')}
              >
                Hivee
              </button>
            </div>

            {/* Render the appropriate component based on the selected upload type */}
            {uploadType === 'Post' && <UploadPost currentUser={currentUser} />}
            {uploadType === 'Hivee' && <UploadHivee currentUser={currentUser} />}
          </main>
        )}

        {/* Conditionally render SidebarRight or ChatInterface */}
        <div className="hidden lg:flex flex-col w-96">
          {!selectedChat ? (
            <SidebarRight currentUser={currentUser} setSelectedChat={setSelectedChat} />
          ) : (
            <ChatInterface currentUser={currentUser} chatRoomId={selectedChat} onBack={handleBackToSidebar} />
          )}
        </div>

        {/* Show SidebarRight on mobile if isSidebarRightVisible is true */}
        {isSidebarRightVisible && (
          <div ref={sidebarRightRef} className="lg:hidden fixed bottom-0 left-0 right-0 bg-white shadow-lg z-50 p-4">
            <SidebarRight currentUser={currentUser} setSelectedChat={setSelectedChat} />
          </div>
        )}
      </div>

      {/* Bottom Bar for mobile, visible only if no chat is selected */}
      {!selectedChat && (
        <BottomBar toggleSidebarRight={toggleSidebarRight} />
      )}
    </div>
  );
};

export default UploadPage;
