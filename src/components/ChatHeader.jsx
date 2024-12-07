import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { FaArrowLeft } from 'react-icons/fa';

const ChatHeader = ({ chatRoomId, currentUser, onBack }) => {
  const [oppositeUser, setOppositeUser] = useState({ fullName: '', avatar: '', id: '' });
  const navigate = useNavigate(); // For navigation
  const db = getFirestore();

  useEffect(() => {
    console.log("useEffect triggered for ChatHeader");
    console.log("Received chatRoomId in ChatHeader:", chatRoomId); // Log chatRoomId
    console.log("Received currentUser in ChatHeader:", currentUser); // Log currentUser

    const fetchUserData = async () => {
      if (!chatRoomId || !currentUser) {
        console.log("Missing chatRoomId or currentUser");
        return;
      }

      try {
        // Fetch the chat room document from Firestore
        const chatRoomRef = doc(db, 'chatRooms', chatRoomId);
        const chatRoomDoc = await getDoc(chatRoomRef);

        if (chatRoomDoc.exists()) {
          const usersInChat = chatRoomDoc.data().users; // List of users in the chat room
          console.log('Users in chat room:', usersInChat);

          if (usersInChat && usersInChat.length === 2) {
            // Find the opposite user by excluding the current user
            const oppositeUserId = usersInChat.find(userId => userId !== currentUser.uid);
            console.log('Opposite User ID:', oppositeUserId);

            // Fetch opposite user's data
            const oppositeUserRef = doc(db, 'users', oppositeUserId);
            const oppositeUserDoc = await getDoc(oppositeUserRef);

            if (oppositeUserDoc.exists()) {
              // Set opposite user data to state
              setOppositeUser({
                fullName: oppositeUserDoc.data().fullName,
                avatar: oppositeUserDoc.data().avatar,
                id: oppositeUserId, // Add user ID for navigation
              });
            } else {
              console.error('Opposite user document does not exist');
            }
          } else {
            console.error('Chat room does not have exactly two users');
          }
        } else {
          console.error('Chat room document does not exist');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, [chatRoomId, currentUser, db]);

  return (
    <div className="flex items-center justify-between p-4 bg-white text-black shadow-lg">
      <button onClick={() => navigate('/')} className="text-black font-bold flex items-center">
        <FaArrowLeft className="mr-2" /> Back
      </button>
      <div className="flex items-center space-x-4">
        {oppositeUser.avatar && (
          <img
            src={oppositeUser.avatar}
            alt="opposite user avatar"
            className="w-10 h-10 rounded-full border-2 border-black cursor-pointer"
            onClick={() => navigate(`/user/${oppositeUser.id}`)}
          />
        )}
        <span
          className="text-lg font-semibold cursor-pointer"
          onClick={() => navigate(`/user/${oppositeUser.id}`)}
        >
          {oppositeUser.fullName || 'Loading...'}
        </span>
      </div>
    </div>
  );
};

export default ChatHeader;
