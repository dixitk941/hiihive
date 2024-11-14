import React from 'react';
import logo from '../assets/loader.gif';

const LoadingPage = () => {
  return (
    <div className="h-screen flex flex-col justify-center items-center bg-gray-100">
      {/* HiiHive Logo in the center */}
      <div className="flex items-center justify-center mb-4">
        <img src={logo} alt="HiiHive Logo" className="w-48 h-48" style={{ background: 'transparent' }} />
      </div>

      {/* Powered by and Designed by Text */}
      <div className="absolute bottom-4 text-gray-700 text-sm text-center">
        <p>Designed by <span className="font-semibold">dixitk941</span></p>
        <p>Powered by <span className="font-semibold">AINOR</span></p>
      </div>
    </div>
  );
};

export default LoadingPage;