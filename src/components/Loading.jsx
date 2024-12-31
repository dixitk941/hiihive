import React from 'react';
import logo from '../assets/logo1.png';

const LoadingPage = () => {
  return (
    <div className="h-screen flex flex-col justify-center items-center bg-gradient-to-r from-gray-50 via-gray-100 to-gray-200 dark:bg-gradient-to-r dark:from-gray-800 dark:via-gray-900 dark:to-black relative overflow-hidden">
      {/* Animated Background Circles */}
      <div className="absolute w-72 h-72 bg-gray-200 dark:bg-gray-700 rounded-full opacity-30 animate-pulse" style={{ top: '10%', left: '10%' }}></div>
      <div className="absolute w-96 h-96 bg-gray-300 dark:bg-gray-600 rounded-full opacity-20 animate-pulse" style={{ top: '50%', left: '60%' }}></div>
      <div className="absolute w-64 h-64 bg-gray-400 dark:bg-gray-500 rounded-full opacity-10 animate-pulse" style={{ top: '80%', left: '30%' }}></div>

      {/* HiiHive Logo in the center with lighting effect */}
      <div className="flex items-center justify-center mb-6 z-10">
        <img 
          src={logo} 
          alt="HiiHive Logo" 
          className="w-48 h-48"
          style={{
            background: 'transparent',
            boxShadow: '0 0 15px rgba(255, 255, 255, 0.8)', // Glowing effect for light theme
          }}
        />
      </div>

      {/* Made in India Section */}
      <div className="relative flex flex-col items-center justify-center z-20">
        {/* Simple Light Box */}
        <div className="relative bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md border border-gray-200 dark:border-gray-600">
          <p className="text-2xl font-bold text-gray-800 dark:text-white text-center">
            Made in India
          </p>
          {/* Indian Flag */}
          <div className="mt-2 flex items-center justify-center">
            <img
              src="https://cdn.jsdelivr.net/gh/twitter/twemoji@v14.0.2/assets/svg/1f1ee-1f1f3.svg"
              alt="Indian Flag"
              className="w-8 h-8"
            />
          </div>
        </div>
      </div>

      {/* Powered by AINOR */}
      <div className="absolute bottom-4 text-gray-600 dark:text-gray-300 text-sm text-center z-10">
        <p className="text-lg font-semibold">by</p>
        <p className="text-lg font-bold">AINOR</p>
      </div>
    </div>
  );
};

export default LoadingPage;
