import React from 'react';
import logo from '../assets/loader.gif';

const LoadingPage = () => {
  return (
    <div className="h-screen flex flex-col justify-center items-center bg-gradient-to-r from-blue-100 to-blue-300 relative overflow-hidden">
      {/* Animated Background Circles */}
      <div className="absolute w-72 h-72 bg-blue-200 rounded-full opacity-70 animate-pulse" style={{ top: '10%', left: '10%' }}></div>
      <div className="absolute w-96 h-96 bg-blue-300 rounded-full opacity-50 animate-pulse" style={{ top: '50%', left: '60%' }}></div>
      <div className="absolute w-64 h-64 bg-blue-400 rounded-full opacity-30 animate-pulse" style={{ top: '80%', left: '30%' }}></div>

      {/* HiiHive Logo in the center */}
      <div className="flex items-center justify-center mb-4 z-10">
        <img src={logo} alt="HiiHive Logo" className="w-48 h-48" style={{ background: 'transparent' }} />
      </div>

      {/* Powered by and Designed by Text */}
      <div className="absolute bottom-4 text-gray-700 text-sm text-center z-10">
        <p className="text-lg font-semibold">by</p>
        <p className="text-lg font-semibold">AINOR</p>
      </div>
    </div>
  );
};

export default LoadingPage;