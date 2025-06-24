import React, { useState, useEffect } from 'react';
import MarketPlace from '../components/MarketPlace';
import SEOHead from '../components/SEOHead';

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
  }, []);  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black transition-colors duration-300 p-4">
        <div className="max-w-7xl mx-auto">
          {/* Marketplace header skeleton */}
          <div className="flex items-center justify-between mb-6 animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-40"></div>
            <div className="w-40 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
          </div>
          
          {/* Search and filter skeleton */}
          <div className="flex flex-col md:flex-row gap-4 mb-8 animate-pulse">
            <div className="flex-1 h-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
            <div className="w-32 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          </div>
          
          {/* Products grid skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm animate-pulse">
                <div className="aspect-square w-full bg-gray-200 dark:bg-gray-700"></div>
                <div className="p-4">
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-3"></div>
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
                  <div className="flex justify-between items-center">
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                    <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-black transition-colors duration-300">
      <SEOHead 
        title="Student Marketplace - Buy, Sell & Exchange on HiiHive"
        description="Buy, sell, and exchange items with your college community. Find textbooks, electronics, furniture, and more in the HiiHive student marketplace."
        url="https://hiihive.com/marketplace"
        keywords="student marketplace, college buy sell, textbook exchange, student items, campus marketplace, college trading"
      />
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