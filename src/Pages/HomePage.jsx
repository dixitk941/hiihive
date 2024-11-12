import React, { useState } from 'react';
import SidebarLeft from '../components/SidebarLeft';
import SidebarRight from '../components/SidebarRight';
import SearchBar from '../components/SearchBar';
import Feeds from '../components/Feeds';
import FloatingMenu from '../components/FloatingMenu';
import ChatInterface from '../components/ChatInterface';
import BottomBar from '../components/BottomBar'; // Import the new BottomBar component

function HomePage() {
  const [selectedChat, setSelectedChat] = useState(null); // Manage selected chat

  return (
    <div className="flex flex-col h-screen">
      <div className="flex flex-1 pt-24"> {/* Add padding-top to avoid being hidden by the header */}
        {/* SidebarLeft for main navigation */}
        <div className="hidden lg:block w-[250px]">
          <SidebarLeft />
        </div>
        
        {/* Main content section with SearchBar and Feeds */}
        <main className="flex-1 p-4 overflow-auto">
          <SearchBar />
          <Feeds />
        </main>

        {/* Conditionally render SidebarRight or ChatInterface */}
        <div className="hidden lg:flex flex-col w-96">
          {/* If no chat is selected, show the SidebarRight */}
          {!selectedChat ? (
            <SidebarRight setSelectedChat={setSelectedChat} />
          ) : (
            <ChatInterface selectedChat={selectedChat} /> // Show ChatInterface when a chat is selected
          )}
        </div>

        {/* Show ChatInterface on mobile if chat is selected */}
        {selectedChat && (
          <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white shadow-lg z-50 p-4">
            <ChatInterface selectedChat={selectedChat} />
          </div>
        )}
      </div>

      {/* Floating menu for additional options */}
      <div className="lg:hidden">
        <FloatingMenu /> {/* FloatingMenu is hidden on mobile */}
      </div>

      {/* Bottom Bar for mobile */}
      <BottomBar /> {/* Use BottomBar for mobile */}
    </div>
  );
}

export default HomePage;