import React, { useEffect, useState } from 'react';
import logo from '../assets/logo.svg'; // Adjust the path as necessary

const Header = ({ user }) => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <header className={`fixed top-0 left-0 right-0 flex items-center justify-between px-8 py-5 bg-white shadow-md border-b border-gray-200 z-50 transition-all duration-300 ${isScrolled ? 'bg-opacity-90 backdrop-blur-md' : ''}`}>
      <div className="flex items-center space-x-4">
        <img src={logo} alt="Logo" className="w-16 h-16" />
        <h1 className="text-3xl font-extrabold tracking-wide text-gray-800 animate-fadeIn">
          Hii<span className="text-blue-500">Hive</span>
        </h1>
      </div>
      <div className="flex items-center space-x-6">
        <span className="hidden md:block text-gray-600 font-medium tracking-wide hover:text-blue-500 transition duration-300 ease-in-out">
          {user.displayName || 'User Profile'}
        </span>
        <div className="relative group">
          <img 
            src={user?.photoURL || 'profile.jpg'} // Fallback to default if no photoURL is available
            alt="User" 
            className="w-12 h-12 rounded-full border-2 border-gray-300 transition-transform duration-300 transform group-hover:scale-105 group-hover:border-blue-400"
          />
          <div className="absolute inset-0 w-12 h-12 rounded-full bg-blue-100 opacity-0 group-hover:opacity-20 blur-md transition-opacity duration-300"></div>
        </div>
      </div>
    </header>
  );
};

export default Header;