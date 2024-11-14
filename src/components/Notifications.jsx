import React from 'react';
import comingSoonGif from '../assets/comingsoon.gif'; // Adjust the path according to your project structure

const Notifications = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <img src={comingSoonGif} alt="Coming Soon" className="w-64 h-64 mb-4" />
      <h1 className="text-2xl font-semibold text-gray-700">Notifications Coming Soon</h1>
    </div>
  );
};

export default Notifications;