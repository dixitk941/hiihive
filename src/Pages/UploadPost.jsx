import React, { useState, useEffect, useRef } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, addDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';
import SidebarLeft from '../components/SidebarLeft';
import SidebarRight from '../components/SidebarRight';
import UploadPost from '../components/UploadPost';
import UploadHivee from '../components/UploadHivee';
import ChatInterface from '../components/ChatInterface';
import BottomBar from '../components/BottomBar';
import loaderGif from '../assets/normload.gif';
import FusionPost from '../components/FusionPost';
import PollPost from '../components/UploadPoll';

const UploadPage = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedChat, setSelectedChat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarRightVisible, setIsSidebarRightVisible] = useState(false);
  const [uploadType, setUploadType] = useState('Post');
  const [pollData, setPollData] = useState({ question: '', options: [] });
  const [isDarkMode, setIsDarkMode] = useState(false);
  const sidebarRightRef = useRef(null);

  useEffect(() => {
    // Detect system theme preference
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDarkMode(mediaQuery.matches);

    const handleChange = (e) => setIsDarkMode(e.matches);
    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

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

  const handlePollSubmit = async (question, options) => {
    if (!question || options.length < 2) {
      alert('Please enter a question and at least two options.');
      return;
    }

    try {
      const auth = getAuth();
      const user = auth.currentUser;
      const newPoll = { question, options, votes: Array(options.length).fill(0), userId: user.uid };
      await addDoc(collection(db, 'polls'), newPoll);
      alert('Poll posted successfully!');
    } catch (error) {
      console.error('Error posting poll:', error);
      alert('Failed to post poll.');
    }
  };

  return (
    <div
      className={`flex flex-col h-screen ${
        isDarkMode ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'
      }`}
    >
      <div className="flex flex-1 pt-16 lg:pt-20">
        {/* SidebarLeft */}
        <div className={`hidden lg:block w-64 ${isDarkMode ? 'bg-black' : 'bg-white'} shadow-md`}>
          <SidebarLeft currentUser={currentUser} />
        </div>

        {/* Main Content */}
        {!selectedChat && (
          <main className="flex-1 p-6 overflow-y-auto">
          <div className="flex space-x-4 mb-4">
  <button
    className={`flex-1 py-2 rounded-lg font-semibold transition-all ${
      uploadType === 'Post'
        ? 'bg-blue-600 text-white shadow-md'
        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
    }`}
    onClick={() => setUploadType('Post')}
  >
    Post
  </button>

  <button
    className={`flex-1 py-2 rounded-lg font-semibold transition-all ${
      uploadType === 'Hivee'
        ? 'bg-blue-600 text-white shadow-md'
        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
    }`}
    onClick={() => setUploadType('Hivee')}
  >
    Hivee
  </button>

  <button
    className={`flex-1 py-2 rounded-lg font-semibold transition-all ${
      uploadType === 'Poll'
        ? 'bg-blue-600 text-white shadow-md'
        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
    }`}
    onClick={() => setUploadType('Poll')}
  >
    Poll
  </button>
</div>

            {uploadType === 'Post' ? (
              <FusionPost currentUser={currentUser} />
            ) : uploadType === 'Hivee' ? (
              <UploadHivee currentUser={currentUser} />
            ) : (
              <PollPost
                question={pollData.question}
                options={pollData.options}
                setPollData={setPollData}
                handleSubmit={handlePollSubmit}
              />
            )}
          </main>
        )}

        {/* SidebarRight or ChatInterface */}
        {isSidebarRightVisible && (
          <div
            ref={sidebarRightRef}
            className={`lg:hidden fixed inset-0 ${
              isDarkMode ? 'bg-black' : 'bg-white'
            } shadow-lg z-50`}
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
