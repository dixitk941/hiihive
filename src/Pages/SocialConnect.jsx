import React, { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';
import FriendDiscovery from '../components/social/FriendDiscovery';
import CampusEvents from '../components/social/CampusEvents';
import SocialStatus from '../components/social/SocialStatus';
import SidebarLeft from '../components/SidebarLeft';
import BottomBar from '../components/BottomBar';
import { FiUsers, FiHeart, FiCalendar, FiTrendingUp } from 'react-icons/fi';

const SocialConnect = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Check for saved theme preference or default to system preference
    const savedTheme = localStorage.getItem('theme');
    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialDarkMode = savedTheme ? savedTheme === 'dark' : prefersDarkMode;
    
    setIsDarkMode(initialDarkMode);
    
    // Update document class instead of body
    if (initialDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Listener for theme change
    const handleThemeChange = (e) => {
      if (!localStorage.getItem('theme')) {
        setIsDarkMode(e.matches);
        document.documentElement.classList.toggle('dark', e.matches);
      }
    };

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', handleThemeChange);

    return () => {
      mediaQuery.removeEventListener('change', handleThemeChange);
    };
  }, []);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        try {
          const userRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userRef);
          if (userDoc.exists()) {
            setCurrentUser({ ...user, ...userDoc.data() });
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-black transition-colors duration-300">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg animate-pulse"></div>
          <p className="text-gray-600 dark:text-gray-300 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-black transition-colors duration-300">
      <div className="flex flex-1 pt-16 lg:pt-20">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block w-64 xl:w-72 border-r border-gray-200 dark:border-gray-800">
          <div className="fixed h-full w-64 xl:w-72 pt-4 bg-white dark:bg-black overflow-y-auto">
            <SidebarLeft currentUser={currentUser} />
          </div>
        </div>
        
        {/* Main Content - One UI Inspired */}
        <main className="flex-1 min-h-0 overflow-auto">
          <div className="max-w-4xl mx-auto">
            
            {/* Compact Header - One UI Style */}
            <div className="px-4 pt-4 pb-2">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">Social Connect</h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Build meaningful connections</p>
                </div>
                <div className="text-2xl">🤝</div>
              </div>
              
              {/* Compact Stats Row - One UI Inspired */}
              <div className="flex space-x-2 overflow-x-auto scrollbar-hide pb-2">
                <div className="flex items-center space-x-2 bg-white dark:bg-gray-900 px-3 py-2 rounded-xl border border-gray-100 dark:border-gray-800 flex-shrink-0">
                  <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/40 rounded-md flex items-center justify-center">
                    <FiUsers className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">127</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Friends</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 bg-white dark:bg-gray-900 px-3 py-2 rounded-xl border border-gray-100 dark:border-gray-800 flex-shrink-0">
                  <div className="w-6 h-6 bg-pink-100 dark:bg-pink-900/40 rounded-md flex items-center justify-center">
                    <FiCalendar className="w-3 h-3 text-pink-600 dark:text-pink-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">8</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Events</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 bg-white dark:bg-gray-900 px-3 py-2 rounded-xl border border-gray-100 dark:border-gray-800 flex-shrink-0">
                  <div className="w-6 h-6 bg-green-100 dark:bg-green-900/40 rounded-md flex items-center justify-center">
                    <FiTrendingUp className="w-3 h-3 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">42</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Active</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Content Areas - Mobile Optimized */}
            <div className="px-4 space-y-4">
              {/* Desktop Layout */}
              <div className="hidden lg:grid lg:grid-cols-3 lg:gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <FriendDiscovery />
                  <CampusEvents />
                </div>
                <div className="space-y-6">
                  <SocialStatus />
                </div>
              </div>

              {/* Mobile Layout - One UI Inspired Stacking */}
              <div className="lg:hidden space-y-4">
                {/* Priority 1: Friend Discovery */}
                <FriendDiscovery />
                
                {/* Priority 2: Social Status - Higher on mobile for quick access */}
                <SocialStatus />
                
                {/* Priority 3: Campus Events */}
                <CampusEvents />
                
                {/* Quick Action Chips - One UI Style */}
                <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-100 dark:border-gray-800">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-3 text-sm">Quick Actions</h3>
                  <div className="flex space-x-2">
                    <button className="flex-1 flex items-center justify-center py-2 px-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-medium">
                      <FiUsers className="w-3 h-3 mr-1" />
                      Discover
                    </button>
                    <button className="flex-1 flex items-center justify-center py-2 px-3 bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400 rounded-lg text-xs font-medium">
                      <FiCalendar className="w-3 h-3 mr-1" />
                      Events
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Spacing for Mobile Navigation */}
            <div className="lg:hidden h-20"></div>
          </div>
        </main>
      </div>

      {/* Mobile Bottom Bar */}
      <div className="lg:hidden">
        <BottomBar />
      </div>
    </div>
  );
};

export default SocialConnect;