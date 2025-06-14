import React, { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';
import ChatListPage from '../components/ChatList';
import ChatInterface from '../components/ChatInterface';
import { useTheme } from '../context/ThemeContext'; // Import the theme context

const ChatPage = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  // Use the theme context instead of local state
  const { isDarkMode } = useTheme();

  // User authentication and data fetching
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setCurrentUser({
              id: user.uid,
              uid: user.uid, // Keep both for compatibility
              email: user.email,
              displayName: user.displayName,
              photoURL: user.photoURL,
              ...userData
            });
          } else {
            // Fallback to Firebase Auth data if no Firestore document
            setCurrentUser({
              id: user.uid,
              uid: user.uid,
              email: user.email,
              displayName: user.displayName || 'User',
              photoURL: user.photoURL,
              fullName: user.displayName || 'User',
              username: user.email?.split('@')[0] || 'username',
              avatar: user.photoURL || null
            });
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          // Fallback on error
          setCurrentUser({
            id: user.uid,
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || 'User',
            photoURL: user.photoURL,
            fullName: user.displayName || 'User',
            username: user.email?.split('@')[0] || 'username',
            avatar: user.photoURL || null
          });
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);
  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-black dark:via-gray-900 dark:to-gray-900 p-4 md:p-6">
        {/* Skeleton loader for chat interface */}
        <div className="max-w-6xl mx-auto">
          {/* Header skeleton */}
          <div className="bg-white dark:bg-gray-800 rounded-t-xl p-4 shadow-sm animate-pulse mb-1 flex items-center">
            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 mr-3"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/5"></div>
            </div>
            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700"></div>
          </div>
          
          {/* Messages skeleton */}
          <div className="bg-white dark:bg-gray-800 h-[calc(100vh-12rem)] p-4 overflow-y-auto space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                <div className={`flex max-w-[75%] ${i % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`}>
                  {i % 2 === 0 && <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 mr-2 flex-shrink-0"></div>}
                  <div className={`p-3 rounded-xl ${i % 2 === 0 ? 'bg-gray-200 dark:bg-gray-700 rounded-tl-none' : 'bg-blue-100 dark:bg-blue-900 rounded-tr-none'}`}>
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-full mb-2"></div>
                    <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
                    <div className="h-3 mt-1 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
                  </div>
                  {i % 2 !== 0 && <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 ml-2 flex-shrink-0"></div>}
                </div>
              </div>
            ))}
          </div>
          
          {/* Input box skeleton */}
          <div className="bg-white dark:bg-gray-800 rounded-b-xl p-4 shadow-sm">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 mr-2"></div>
              <div className="flex-1 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 ml-2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If no user is authenticated, show a message or redirect
  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-black dark:via-gray-900 dark:to-gray-900">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            Welcome to HiiHive Chat
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Please sign in to start conversations and connect with your friends
          </p>
          <button className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg transition-all duration-200">
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-black overflow-hidden">
      {/* Main Layout - Instagram Style */}
      <div className="flex flex-1 h-full">
        {/* ChatList Sidebar - Desktop Only with Independent Scrolling */}
        <div className="hidden lg:flex lg:w-80 xl:w-96 lg:flex-shrink-0 flex-col h-full">
          {/* ChatList Container with Full Height and Independent Scroll */}
          <div className="flex-1 h-full overflow-hidden border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            {/* Custom scrollbar styles for Instagram-like experience */}
            <div className="h-full overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent hover:scrollbar-thumb-gray-400 dark:hover:scrollbar-thumb-gray-500 transition-colors">
              <ChatListPage currentUser={currentUser} isSidebar={true} />
            </div>
          </div>
        </div>
        
        {/* Main Chat Interface with Independent Scrolling */}
        <main className="flex-1 flex flex-col h-full min-w-0">
          {/* ChatInterface Container with Full Height and Independent Scroll */}
          <div className="flex-1 h-full overflow-hidden bg-gray-50 dark:bg-black">
            <ChatInterface currentUser={currentUser} />
          </div>
        </main>
      </div>

      {/* Custom Scrollbar Styles */}
      <style jsx global>{`
        /* Instagram-style custom scrollbars */
        .scrollbar-thin {
          scrollbar-width: thin;
        }
        
        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        
        .scrollbar-thumb-gray-300::-webkit-scrollbar-thumb {
          background-color: #d1d5db;
          border-radius: 3px;
        }
        
        .dark .scrollbar-thumb-gray-600::-webkit-scrollbar-thumb {
          background-color: #4b5563;
          border-radius: 3px;
        }
        
        .scrollbar-track-transparent::-webkit-scrollbar-track {
          background-color: transparent;
        }
        
        .hover\\:scrollbar-thumb-gray-400:hover::-webkit-scrollbar-thumb {
          background-color: #9ca3af;
        }
        
        .dark .hover\\:scrollbar-thumb-gray-500:hover::-webkit-scrollbar-thumb {
          background-color: #6b7280;
        }
        
        /* Smooth scrolling */
        .scrollbar-thin {
          scroll-behavior: smooth;
        }
        
        /* Hide scrollbar when not hovering (Instagram style) */
        .scrollbar-thin::-webkit-scrollbar {
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        
        .scrollbar-thin:hover::-webkit-scrollbar {
          opacity: 1;
        }
        
        /* Custom scroll indicators */
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .fade-in {
          animation: fadeIn 0.3s ease-out;
        }
        
        /* Prevent text selection on scroll elements */
        .scrollbar-thin {
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          user-select: none;
        }
        
        /* Instagram-style gradient overlays for scroll areas */
        .scroll-gradient-top::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 20px;
          background: linear-gradient(to bottom, rgba(255,255,255,1), rgba(255,255,255,0));
          pointer-events: none;
          z-index: 10;
        }
        
        .dark .scroll-gradient-top::before {
          background: linear-gradient(to bottom, rgba(0,0,0,1), rgba(0,0,0,0));
        }
        
        .scroll-gradient-bottom::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 20px;
          background: linear-gradient(to top, rgba(255,255,255,1), rgba(255,255,255,0));
          pointer-events: none;
          z-index: 10;
        }
        
        .dark .scroll-gradient-bottom::after {
          background: linear-gradient(to top, rgba(0,0,0,1), rgba(0,0,0,0));
        }
      `}</style>
    </div>
  );
};

export default ChatPage;