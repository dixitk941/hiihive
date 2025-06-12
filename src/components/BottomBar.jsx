import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { HomeIcon, ChatBubbleLeftIcon, ArrowUpTrayIcon, MagnifyingGlassIcon, PlayIcon, UserIcon } from '@heroicons/react/24/outline';
import { HomeIcon as HomeIconSolid, ChatBubbleLeftIcon as ChatIconSolid, ArrowUpTrayIcon as UploadIconSolid, MagnifyingGlassIcon as ExploreIconSolid, PlayIcon as PlayIconSolid, UserIcon as UserIconSolid } from '@heroicons/react/24/solid';

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
    return location.pathname.startsWith(path);
  };

  const tabs = [
    {
      id: 'home',
      path: '/',
      icon: HomeIcon,
      iconSolid: HomeIconSolid,
      action: () => navigate('/')
    },
    {
      id: 'explore',
      path: '/explore',
      icon: MagnifyingGlassIcon,
      iconSolid: ExploreIconSolid,
      action: () => navigate('/explore')
    },
    {
      id: 'upload',
      path: '/upload',
      icon: ArrowUpTrayIcon,
      iconSolid: UploadIconSolid,
      action: () => navigate('/upload'),
      isSpecial: true
    },
    {
      id: 'hivee',
      path: '/hivee',
      icon: PlayIcon,
      iconSolid: PlayIconSolid,
      action: () => navigate('/hivee')
    },
    {
      id: 'chat',
      path: '/chatlist',
      icon: ChatBubbleLeftIcon,
      iconSolid: ChatIconSolid,
      action: () => navigate('/chatlist')
    }
  ];

  if (isStoryActive) {
    return null;
  }

  return (
    <>
      {/* Main Bottom Bar - Compact Design */}
      <aside className={`sm:hidden fixed bottom-0 left-0 right-0 z-50 transition-all duration-300 ${
        isDarkMode 
          ? 'bg-black border-gray-800' 
          : 'bg-white border-gray-200'
      } border-t`}>
        
        {/* Tab Container - Reduced padding */}
        <div className="flex items-center justify-around px-4 py-3">
          {tabs.map((tab) => {
            const active = isActive(tab.path);
            const IconComponent = tab.icon;
            
            if (tab.isSpecial) {
              // Special upload button - More compact
              return (
                <button
                  key={tab.id}
                  onClick={tab.action}
                  className="relative group"
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
                className={`relative flex items-center justify-center p-2 rounded-full transition-all duration-200 group ${
                  active 
                    ? 'text-blue-500' 
                    : isDarkMode 
                      ? 'text-gray-400 hover:text-white' 
                      : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {/* Active indicator - top dot */}
                {active && (
                  <div className="absolute -top-1 w-1 h-1 rounded-full bg-blue-500" />
                )}
                
                {/* Icon */}
                <IconComponent className={`w-6 h-6 transition-all duration-200 ${
                  active ? 'scale-110' : 'group-hover:scale-105'
                }`} />
                
                {/* Active background circle */}
                {active && (
                  <div className={`absolute inset-0 rounded-full transition-all duration-300 ${
                    isDarkMode 
                      ? 'bg-blue-500/15' 
                      : 'bg-blue-50'
                  }`} />
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