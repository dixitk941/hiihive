import React, { useState, useEffect, useRef } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';
import SidebarLeft from '../components/SidebarLeft';
import SidebarRight from '../components/SidebarRight';
import UploadPost from '../components/UploadPost';
import UploadHivee from '../components/UploadHivee';
import ChatInterface from '../components/ChatInterface';
import BottomBar from '../components/BottomBar';
import loaderGif from '../assets/normload.gif';
import FusionPost from '../components/FusionPost';

const UploadPage = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedChat, setSelectedChat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarRightVisible, setIsSidebarRightVisible] = useState(false);
  const [uploadType, setUploadType] = useState('Post');
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
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const toggleSidebarRight = () => setIsSidebarRightVisible(!isSidebarRightVisible);

  // if (loading) {
  //   return (
  //     <div className="flex justify-center items-center h-screen bg-gray-100">
  //       <img src={loaderGif} alt="Loading" className="w-20 h-20 animate-spin" />
  //     </div>
  //   );
  // }

  return (
    <div className="flex flex-col h-screen bg-gray-50 text-gray-900">
      <div className="flex flex-1 pt-16 lg:pt-20">
        {/* SidebarLeft */}
        <div className="hidden lg:block w-64 bg-white shadow-md">
          <SidebarLeft currentUser={currentUser} />
        </div>

        {/* Main Content */}
        {!selectedChat && (
          <main className="flex-1 p-6 overflow-y-auto">
            <div className="flex space-x-4 mb-4">
              <button
                className={`flex-1 py-2 rounded-lg font-semibold transition-all ${
                  uploadType === 'Post'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 hover:bg-gray-300'
                }`}
                onClick={() => setUploadType('Post')}
              >
                Post
              </button>
              <button
                className={`flex-1 py-2 rounded-lg font-semibold transition-all ${
                  uploadType === 'Hivee'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 hover:bg-gray-300'
                }`}
                onClick={() => setUploadType('Hivee')}
              >
                Hivee
              </button>
            </div>
            {uploadType === 'Post' ? (
              <FusionPost currentUser={currentUser} />
            ) : (
              <UploadHivee currentUser={currentUser} />
            )}
          </main>
        )}

        {/* SidebarRight or ChatInterface */}
        {/* <div className="hidden lg:block w-80 bg-white shadow-md">
          {!selectedChat ? (
            <SidebarRight currentUser={currentUser} setSelectedChat={setSelectedChat} />
          ) : (
            <ChatInterface
              currentUser={currentUser}
              chatRoomId={selectedChat}
              onBack={() => setSelectedChat(null)}
            />
          )}
        </div> */}

        {/* Mobile SidebarRight */}
        {isSidebarRightVisible && (
          <div
            ref={sidebarRightRef}
            className="lg:hidden fixed inset-0 bg-white shadow-lg z-50"
          >
            <SidebarRight currentUser={currentUser} setSelectedChat={setSelectedChat} />
          </div>
        )}
      </div>

      {/* BottomBar */}
      {!selectedChat && <BottomBar toggleSidebarRight={toggleSidebarRight} />}
    </div>
  );
};

export default UploadPage;
