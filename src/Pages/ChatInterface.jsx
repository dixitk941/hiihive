import React, { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';
import ChatListPage from '../components/ChatList';
import ChatInterface from '../components/ChatInterface';
import loaderGif from '../assets/normload.gif';

const ChatPage = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Theme detection and management
  useEffect(() => {
    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDarkMode(prefersDarkMode);
    document.documentElement.classList.toggle('dark', prefersDarkMode);

    const handleThemeChange = (e) => {
      setIsDarkMode(e.matches);
      document.documentElement.classList.toggle('dark', e.matches);
    };

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', handleThemeChange);

    return () => {
      mediaQuery.removeEventListener('change', handleThemeChange);
    };
  }, []);

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
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-black dark:via-gray-900 dark:to-gray-900">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <img src={loaderGif} alt="Loading" className="w-16 h-16 opacity-75" />
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full opacity-20 animate-pulse"></div>
          </div>
          <p className="text-gray-500 dark:text-gray-400 font-medium">Loading your conversations...</p>
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