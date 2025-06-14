import React, { useState, useEffect, useRef } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebaseConfig"; // Import your Firebase config
import SidebarLeft from "../components/SidebarLeft";
import SidebarRight from "../components/SidebarRight";
import Hivee from "../components/Hivee";
import ChatInterface from "../components/ChatInterface";
import BottomBar from "../components/BottomBar";

const HiveePage = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedChat, setSelectedChat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarRightVisible, setIsSidebarRightVisible] = useState(false);
  const sidebarRightRef = useRef(null);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        const userRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          setCurrentUser({ ...user, ...userDoc.data() });
        } else {
          console.log("No such document!");
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

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
      document.addEventListener("mousemove", handleActivity);
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      clearTimeout(timeout);
      document.removeEventListener("mousemove", handleActivity);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isSidebarRightVisible]);

  const handleBackToSidebar = () => {
    setSelectedChat(null);
  };
  const toggleSidebarRight = () => {
    setIsSidebarRightVisible(!isSidebarRightVisible);
  };
  if (loading) {
    return (
      <div className="h-screen bg-gray-50 dark:bg-black">
        <div className="flex h-full">
          {/* Sidebar left skeleton */}
          <div className="hidden md:block w-64 border-r border-gray-200 dark:border-gray-800 animate-pulse">
            <div className="p-4">
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-xl mb-6"></div>
              
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex items-center mb-4">
                  <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 mr-3"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Main content skeleton */}
          <div className="flex-1 p-4 overflow-hidden">
            {/* Header skeleton */}
            <div className="flex justify-between items-center mb-6 animate-pulse">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
              <div className="flex space-x-3">
                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700"></div>
              </div>
            </div>
            
            {/* Hivee posts skeleton */}
            <div className="space-y-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm animate-pulse">
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 mr-3"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                    </div>
                  </div>
                  
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-3"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6 mb-3"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-6"></div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex space-x-3">
                      <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                      <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                      <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Sidebar right skeleton */}
          <div className="hidden lg:block w-80 border-l border-gray-200 dark:border-gray-800 p-4 animate-pulse">
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-xl mb-6"></div>
            
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center mb-4">
                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 mr-3"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="flex flex-1 pt-16">
        {/* SidebarLeft for main navigation */}
        <div className="hidden lg:block w-[250px] bg-gray-800 text-white">
          <SidebarLeft currentUser={currentUser} />
        </div>

        {/* Main content section with Hivee */}
        {!selectedChat && (
          <main className="flex-1 p-4 overflow-auto bg-gray-100">
            <Hivee currentUser={currentUser} />
          </main>
        )}

        {/* Right sidebar or chat interface */}
        <div className="hidden lg:flex flex-col w-96 bg-white shadow-md">
          {!selectedChat ? (
            <SidebarRight currentUser={currentUser} setSelectedChat={setSelectedChat} />
          ) : (
            <ChatInterface
              currentUser={currentUser}
              chatRoomId={selectedChat}
              onBack={handleBackToSidebar}
            />
          )}
        </div>

        {/* Mobile Right Sidebar */}
        {isSidebarRightVisible && (
          <div
            ref={sidebarRightRef}
            className="lg:hidden fixed bottom-0 left-0 right-0 bg-white shadow-lg z-50 p-4"
          >
            <SidebarRight currentUser={currentUser} setSelectedChat={setSelectedChat} />
          </div>
        )}
      </div>

      {/* Bottom bar for mobile */}
      {!selectedChat && (
        <BottomBar toggleSidebarRight={toggleSidebarRight} />
      )}
    </div>
  );
};

export default HiveePage;
