import React, { useState, useEffect } from 'react';
import FriendDiscovery from '../components/social/FriendDiscovery';
import CampusEvents from '../components/social/CampusEvents';
import SocialStatus from '../components/social/SocialStatus';
import SEOHead from '../components/SEOHead';
import { FiUsers, FiCalendar, FiTrendingUp } from 'react-icons/fi';

const SocialConnect = () => {
  const [loading, setLoading] = useState(true);

  // Theme handling
  useEffect(() => {
    // Check for saved theme preference or default to system preference
    const savedTheme = localStorage.getItem('theme');
    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialDarkMode = savedTheme ? savedTheme === 'dark' : prefersDarkMode;
    
    // Update document class instead of body
    if (initialDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Listener for theme change
    const handleThemeChange = (e) => {
      if (!localStorage.getItem('theme')) {
        document.documentElement.classList.toggle('dark', e.matches);
      }
    };

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', handleThemeChange);

    // Set loading to false after a short delay
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => {
      mediaQuery.removeEventListener('change', handleThemeChange);
      clearTimeout(timer);
    };
  }, []);
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black transition-colors duration-300 p-4">
        <div className="max-w-6xl mx-auto">
          {/* Header skeleton */}
          <div className="flex items-center justify-between mb-8 animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64"></div>
            <div className="flex space-x-3">
              <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700"></div>
              <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700"></div>
            </div>
          </div>
          
          {/* Social connect content */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Friend suggestions skeleton */}
            <div className="md:col-span-2 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm animate-pulse">
              <div className="flex justify-between items-center mb-6">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
                <div className="w-24 h-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              </div>
              
              <div className="space-y-6">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center p-3 border-b border-gray-100 dark:border-gray-700">
                    <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 mr-4"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                    </div>
                    <div className="w-24 h-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Activity & events skeleton */}
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm animate-pulse">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-4"></div>
                
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 mr-3"></div>
                      <div className="flex-1">
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full mb-1"></div>
                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm animate-pulse">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-40 mb-4"></div>
                
                <div className="space-y-4">
                  {[...Array(2)].map((_, i) => (
                    <div key={i} className="rounded-lg bg-gray-200 dark:bg-gray-700 h-24"></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-black transition-colors duration-300">
      <SEOHead 
        title="Social Connect - Meet People at HiiHive"
        description="Discover new friends, connect with classmates, and build meaningful relationships in your college community. Find people with shared interests and expand your social circle."
        url="https://hiihive.com/social-connect"
        keywords="college friends, meet people, social networking, college community, friend discovery, student connections"
      />
      {/* Main Content */}
      <main className="flex-1 min-h-0 overflow-auto pt-16">
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

          {/* Content Areas */}
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
        </div>
      </main>
    </div>
  );
};

export default SocialConnect;
