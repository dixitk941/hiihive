import React, { useState, useEffect, startTransition } from 'react';
import { db } from './firebaseConfig'; // Import your Firebase config
import { collection, query, where, onSnapshot, addDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons'; // Import faPlus icon
import { useNavigate } from 'react-router-dom';

const CommunityPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [communities, setCommunities] = useState([]);
  const [filteredCommunities, setFilteredCommunities] = useState([]);
  const [showCommunityForm, setShowCommunityForm] = useState(false); // Show/hide new community form
  const [communityName, setCommunityName] = useState(''); // Community name input
  const [communityImage, setCommunityImage] = useState(null); // Community image input
  const navigate = useNavigate();
  const currentUser = getAuth().currentUser;

  useEffect(() => {
    if (!currentUser) return;

    // Fetch communities from Firestore
    const communityQuery = collection(db, 'communities');
    const unsubscribeCommunities = onSnapshot(communityQuery, (snapshot) => {
      const communityList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setCommunities(communityList);
      setFilteredCommunities(communityList); // Initially set filtered communities to all
    });

    return () => {
      unsubscribeCommunities();
    };
  }, [currentUser]);

  // Filter communities based on search term
  const handleSearchChange = (event) => {
    const value = event.target.value;
    startTransition(() => {
      setSearchTerm(value);
      filterCommunities(value);
    });
  };

  const filterCommunities = (term) => {
    const filteredComms = communities.filter((community) =>
      community.name.toLowerCase().includes(term.toLowerCase())
    );
    setFilteredCommunities(filteredComms);
  };

  const handleCommunityClick = (communityId) => {
    navigate(`/community/${communityId}`); // Navigate to the community page
  };

  // Create a new community
  const createNewCommunity = async () => {
    try {
      if (!communityName) return;

      const newCommunityData = {
        name: communityName,
        profileImage: communityImage || '/default-community-image.png', // Placeholder image if not uploaded
        createdBy: currentUser.uid,
      };

      const newCommunityRef = await addDoc(collection(db, 'communities'), newCommunityData);

      // Navigate to the new community page
      navigate(`/community/${newCommunityRef.id}`);
    } catch (error) {
      console.error('Error creating new community:', error);
    }
  };

  const renderCommunities = () => (
    <div className="w-full max-w-md mt-4 mb-16">
      {filteredCommunities.length > 0 ? (
        filteredCommunities.map((community) => (
          <div
            key={community.id}
            className="flex items-center p-4 bg-white shadow-sm rounded-lg mb-2 hover:bg-gray-200 transition cursor-pointer border border-black"
            onClick={() => handleCommunityClick(community.id)}
          >
            <img
              src={community.profileImage || '/default-community-image.png'}
              alt="Community Avatar"
              className="w-12 h-12 rounded-full mr-4 shadow-lg"
            />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-800">{community.name}</h3>
            </div>
          </div>
        ))
      ) : (
        <p className="text-center text-gray-500 mt-4">No communities found</p>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center">
      {/* Search Bar */}
      <div className="w-full px-4 py-2 bg-white shadow-md rounded-lg mt-4 mb-2 border border-gray-300">
        <input
          type="text"
          className="w-full p-3 rounded-md text-lg placeholder-gray-400 border border-gray-300 focus:outline-none focus:ring focus:ring-blue-500 transition"
          placeholder="Search communities..."
          value={searchTerm}
          onChange={handleSearchChange}
        />
      </div>

      {/* Floating New Community Button */}
      <button
        onClick={() => setShowCommunityForm((prev) => !prev)} // Toggle the visibility of the community form
        className="fixed bottom-20 right-8 p-4 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition z-50"
      >
        <FontAwesomeIcon icon={faPlus} size="lg" />
      </button>

      {/* Show create new community form */}
      {showCommunityForm && (
        <div className="w-full max-w-md mt-4 bg-white p-4 rounded-lg shadow-md mb-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Create a New Community</h3>
          <input
            type="text"
            className="w-full p-3 rounded-md text-lg mb-4 placeholder-gray-400 border border-gray-300 focus:outline-none focus:ring focus:ring-blue-500 transition"
            placeholder="Community Name"
            value={communityName}
            onChange={(e) => setCommunityName(e.target.value)}
          />
          <input
            type="file"
            className="w-full p-3 rounded-md mb-4"
            onChange={(e) => setCommunityImage(e.target.files[0])}
          />
          <button
            onClick={createNewCommunity}
            className="w-full p-3 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 transition"
          >
            Create Community
          </button>
        </div>
      )}

      {/* Render communities */}
      {renderCommunities()}
    </div>
  );
};

export default CommunityPage;
