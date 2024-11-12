import React, { useState } from 'react';
import SidebarRight from './SidebarRight';  // Import SidebarRight
import ChatInterface from './ChatInterface'; // Import ChatInterface

const App = () => {
  const [selectedChat, setSelectedChat] = useState(null); // Manage selected chat

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <SidebarRight setSelectedChat={setSelectedChat} /> {/* Pass setSelectedChat to SidebarRight */}

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedChat ? (
          <ChatInterface selectedChat={selectedChat} /> // Pass selectedChat to ChatInterface
        ) : (
          <div className="flex-1 flex justify-center items-center bg-gray-100">
            <p className="text-lg text-gray-700">Select a chat to start messaging.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
