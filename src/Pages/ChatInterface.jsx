import React, { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebaseConfig'; // Import your Firebase config
import SidebarLeft from '../components/SidebarLeft';
import SidebarRight from '../components/SidebarRight';
import ChatInterface from '../components/ChatInterface';

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
    return <p>Loading...</p>;
  }

  return (
    <div className="flex flex-col h-screen">
<div className="flex flex-1">
{/* SidebarLeft for main navigation */}
        <div className="hidden lg:block w-[250px]">
          <SidebarLeft currentUser={currentUser} /> {/* Pass currentUser to SidebarLeft */}
        </div>
        
        {/* Main content section */}
        <main className="flex-1 p-4 overflow-auto">
          <ChatInterface currentUser={currentUser} chatRoomId={selectedChat} onBack={handleBackToSidebar} />
        </main>

        {/* Conditionally render SidebarRight or ChatInterface */}
        <div className="hidden lg:flex flex-col w-96">
          {/* If no chat is selected, show SidebarRight */}
          {!selectedChat ? (
            <SidebarRight currentUser={currentUser} setSelectedChat={setSelectedChat} /> 
          ) : (
            <ChatInterface currentUser={currentUser} chatRoomId={selectedChat} onBack={handleBackToSidebar} /> 
          )}
        </div>

        {/* Show ChatInterface on mobile if chat is selected */}
        {selectedChat && (
          <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white shadow-lg z-50 p-4">
            <ChatInterface currentUser={currentUser} chatRoomId={selectedChat} onBack={handleBackToSidebar} />
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;
