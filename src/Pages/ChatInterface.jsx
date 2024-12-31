import React, { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebaseConfig'; // Import your Firebase config
import ChatList from '../components/ChatListDesktop';
import ChatInterface from '../components/ChatInterface';
import './ChatPage.css'; // Import the CSS file

const ChatPage = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedChat, setSelectedChat] = useState(null);
  const [loading, setLoading] = useState(true); // Manage loading state
  const [darkMode, setDarkMode] = useState(false); // State for dark mode

  // Detect system theme preference on initial load
  useEffect(() => {
    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDarkMode(prefersDarkMode);
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

  const handleBackToSidebar = () => {
    setSelectedChat(null);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className={`chat-page-container flex h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-black'}`}>
      {/* Chat List Section */}
      <div className={`chat-list-container w-[300px] p-4 overflow-y-auto ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
        <ChatList />
      </div>

      {/* Chat Interface Section */}
      <div className={`chat-interface-container flex-1 p-4 overflow-y-auto ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <ChatInterface currentUser={currentUser} selectedChat={selectedChat} />
      </div>
    </div>
  );
};

export default ChatPage;
