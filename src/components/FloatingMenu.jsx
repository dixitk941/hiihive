import React from 'react';

const FloatingMenu = () => (
  <div className="fixed bottom-6 right-6">
    <div className="relative group">
      <button className="w-12 h-12 bg-blue-500 rounded-full text-white">+</button>
      <div className="absolute bottom-14 right-0 hidden group-hover:flex flex-col items-end space-y-2">
        <button className="p-2 bg-gray-700 text-white rounded">New Post</button>
        <button className="p-2 bg-gray-700 text-white rounded">Join Community</button>
        <button className="p-2 bg-gray-700 text-white rounded">KnowledgeHub</button>
        <button className="p-2 bg-gray-700 text-white rounded">Notifications</button>
      </div>
    </div>
  </div>
);

export default FloatingMenu;
