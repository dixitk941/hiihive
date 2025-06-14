import React, { useState, useEffect } from 'react';
import MarketPlace from '../components/MarketPlace';

const MarketPlacePage = () => {
  const [loading, setLoading] = useState(true);
  
  // Check for theme preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialDarkMode = savedTheme ? savedTheme === 'dark' : prefersDarkMode;
    
    if (initialDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    const handleThemeChange = (e) => {
      if (!localStorage.getItem('theme')) {
        document.documentElement.classList.toggle('dark', e.matches);
      }
    };

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', handleThemeChange);

    // Simulate loading without waiting for auth
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
      <div className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-black transition-colors duration-300">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 border-8 border-gray-200 dark:border-gray-700 rounded-full"></div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 border-8 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-300 text-sm font-medium">Loading marketplace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-black transition-colors duration-300">
      {/* Main content section with MarketPlace */}
      <main className="flex-1 px-4 overflow-y-auto">
        <div className="max-w-6xl mx-auto pb-20">
          <MarketPlace />
        </div>
      </main>
    </div>
  );
};

export default MarketPlacePage;