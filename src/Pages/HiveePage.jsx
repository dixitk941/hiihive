import React, { useState, useEffect, useRef } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebaseConfig"; // Import your Firebase config
import SidebarLeft from "../components/SidebarLeft";
import SidebarRight from "../components/SidebarRight";
import Hivee from "../components/Hivee";
import ChatInterface from "../components/ChatInterface";
import BottomBar from "../components/BottomBar";
import loaderGif from "../assets/normload.gif";

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

  // if (loading) {
  //   return (
  //     <div className="flex justify-center items-center h-screen">
  //       <img src={loaderGif} alt="Loading" className="w-32 h-32" />
  //     </div>
  //   );
  // }

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
