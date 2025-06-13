import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  HomeIcon, 
  ChatBubbleLeftIcon, 
  ArrowUpTrayIcon, 
  UserGroupIcon, // Changed from MagnifyingGlassIcon to UserGroupIcon for Social Connect
  ShoppingBagIcon, 
  UserIcon 
} from '@heroicons/react/24/outline';
import { 
  HomeIcon as HomeIconSolid, 
  ChatBubbleLeftIcon as ChatIconSolid, 
  ArrowUpTrayIcon as UploadIconSolid, 
  UserGroupIcon as SocialConnectIconSolid, // Changed from ExploreIconSolid to SocialConnectIconSolid
  ShoppingBagIcon as ShoppingBagIconSolid, 
  UserIcon as UserIconSolid 
} from '@heroicons/react/24/solid';

const BottomBar = ({ toggleSidebarRight, isStoryActive }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDarkMode(prefersDarkMode);

    const handleThemeChange = (e) => {
      setIsDarkMode(e.matches);
    };

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', handleThemeChange);

    return () => {
      mediaQuery.removeEventListener('change', handleThemeChange);
    };
  }, []);

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    // Handle both social-connect and explore paths for active state
    if (path === '/social-connect') {
      return location.pathname === '/social-connect' || location.pathname === '/explore';
    }
    return location.pathname.startsWith(path);
  };

  const tabs = [
    {
      id: 'home',
      path: '/',
      icon: HomeIcon,
      iconSolid: HomeIconSolid,
      action: () => navigate('/'),
      label: 'Home'
    },
    {
      id: 'social-connect', // Changed from 'explore' to 'social-connect'
      path: '/social-connect',
      icon: UserGroupIcon, // Changed icon
      iconSolid: SocialConnectIconSolid, // Changed icon
      action: () => navigate('/social-connect'),
      label: 'Connect' // Added label for accessibility
    },
    {
      id: 'upload',
      path: '/upload',
      icon: ArrowUpTrayIcon,
      iconSolid: UploadIconSolid,
      action: () => navigate('/upload'),
      isSpecial: true,
      label: 'Upload'
    },
    {
      id: 'marketplace',
      path: '/marketplace',
      icon: ShoppingBagIcon,
      iconSolid: ShoppingBagIconSolid,
      action: () => navigate('/marketplace'),
      label: 'Market'
    },
    {
      id: 'chat',
      path: '/chatlist',
      icon: ChatBubbleLeftIcon,
      iconSolid: ChatIconSolid,
      action: () => navigate('/chatlist'),
      label: 'Chat'
    }
  ];

  if (isStoryActive) {
    return null;
  }

  return (
    <>
      {/* Main Bottom Bar - Compact Design */}
      <aside className={`sm:hidden fixed bottom-0 left-0 right-0 z-50 transition-all duration-300 border-t backdrop-blur-lg ${
        isDarkMode 
          ? 'bg-black/90 border-gray-800' 
          : 'bg-white/90 border-gray-200'
      }`}>
        
        {/* Tab Container - Reduced padding */}
        <div className="flex items-center justify-around px-4 py-3">
          {tabs.map((tab) => {
            const active = isActive(tab.path);
            // Use solid icon for active state, outline for inactive
            const IconComponent = active ? tab.iconSolid : tab.icon;
            
            if (tab.isSpecial) {
              // Special upload button - More compact
              return (
                <button
                  key={tab.id}
                  onClick={tab.action}
                  className="relative group"
                  aria-label={tab.label}
                >
                  {/* Glow effect - smaller */}
                  <div className="absolute inset-0 bg-blue-500 rounded-full blur-md opacity-25 group-active:opacity-40 transition-opacity duration-200" />
                  
                  {/* Button - smaller size */}
                  <div className="relative w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg group-active:scale-95 transition-transform duration-200">
                    <IconComponent className="w-5 h-5 text-white" />
                  </div>
                </button>
              );
            }
            
            return (
              <button
                key={tab.id}
                onClick={tab.action}
                className={`relative flex items-center justify-center p-2.5 rounded-xl transition-all duration-200 group ${
                  active 
                    ? isDarkMode
                      ? 'text-purple-400 bg-purple-500/20' // Changed to purple for social connect theme
                      : 'text-purple-600 bg-purple-50'
                    : isDarkMode 
                      ? 'text-gray-400 hover:text-white hover:bg-gray-800/50' 
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                }`}
                aria-label={tab.label}
              >
                {/* Active indicator - top dot */}
                {active && (
                  <div className={`absolute -top-0.5 w-1 h-1 rounded-full ${
                    tab.id === 'social-connect' 
                      ? isDarkMode ? 'bg-purple-400' : 'bg-purple-600' // Purple for social connect
                      : isDarkMode ? 'bg-blue-400' : 'bg-blue-600'
                  }`} />
                )}
                
                {/* Icon */}
                <IconComponent className={`w-6 h-6 transition-all duration-200 ${
                  active 
                    ? 'scale-110' 
                    : 'group-hover:scale-105'
                }`} />
                
                {/* Optional: Add subtle label below icon for better UX */}
                {active && (
                  <span className={`absolute -bottom-1 text-xs font-medium ${
                    tab.id === 'social-connect'
                      ? isDarkMode ? 'text-purple-400' : 'text-purple-600'
                      : isDarkMode ? 'text-blue-400' : 'text-blue-600'
                  }`}>
                    {tab.id === 'social-connect' ? '•' : '•'}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        
        {/* Safe area for home indicator - minimal space */}
        <div className="h-1" />
      </aside>
    </>
  );
};

export default BottomBar;