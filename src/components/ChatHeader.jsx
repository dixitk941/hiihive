import React, { useState, useEffect } from 'react';
import { FiArrowLeft, FiMoreVertical } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';

const ChatHeader = ({ participants }) => {
  const navigate = useNavigate();
  const db = getFirestore();

  const [participant, setParticipant] = useState({
    name: 'Loading...',
    avatar: '',
    status: 'Loading...',
  });

  useEffect(() => {
    const fetchParticipantDetails = async () => {
      if (!participants) return;

      try {
        const userRef = doc(db, 'users', participants);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          setParticipant({
            name: userData.fullName || 'Unknown User',  // Changed from 'name' to 'fullName'
            avatar: userData.avatar || 'https://via.placeholder.com/150',
            status: userData.status || 'Offline',
          });
        } else {
          console.warn('User not found:', participants);
          setParticipant({
            name: 'Unknown User',
            avatar: 'https://via.placeholder.com/150',
            status: 'Offline',
          });
        }
      } catch (error) {
        console.error('Error fetching user details:', error);
        setParticipant({
          name: 'Error',
          avatar: 'https://via.placeholder.com/150',
          status: 'Offline',
        });
      }
    };

    fetchParticipantDetails();
  }, [participants, db]);

  return (
    <div
      className="relative mx-4 mt-2 py-2 px-4 bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 
      text-white rounded-lg shadow-lg transform transition-all duration-300 hover:scale-105"
    >
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="text-white hover:opacity-80 transition-opacity duration-300"
      >
        <FiArrowLeft size={20} />
      </button>

      {/* Profile and Chat Info */}
      <div className="flex items-center ml-3 space-x-3">
        <div className="w-8 h-8 rounded-full bg-white overflow-hidden border-2 border-white">
          {/* Profile image */}
          <img
            src={participant.avatar}
            alt={participant.name}
            className="w-full h-full object-cover"
          />
        </div>
        <div>
          <h2 className="text-sm font-semibold leading-tight">{participant.name}</h2>
          <p className="text-xs opacity-80">{participant.status}</p>
        </div>
      </div>

      {/* More Options */}
      <button
        className="absolute top-2 right-4 text-white hover:scale-110 transition-transform duration-200"
        title="More options"
      >
        <FiMoreVertical size={16} />
      </button>
    </div>
  );
};

export default ChatHeader;
