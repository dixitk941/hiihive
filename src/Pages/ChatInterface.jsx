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
    <div className="chat-page-container flex h-screen">
      {/* Chat List Section */}
      <div className="chat-list-container w-[300px] bg-gray-100 p-4 overflow-y-auto">
        <ChatList />
      </div>

      {/* Chat Interface Section */}
      <div className="chat-interface-container flex-1 bg-white p-4 overflow-y-auto">
        <ChatInterface currentUser={currentUser} selectedChat={selectedChat} />
      </div>
    </div>
  );
};

export default ChatPage;
