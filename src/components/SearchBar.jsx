import React, { useState, useEffect } from 'react';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { AiOutlineSearch } from 'react-icons/ai';
import { useNavigate } from 'react-router-dom'; // Use useNavigate instead of useHistory

const SearchBar = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const firestore = getFirestore();
  const navigate = useNavigate(); // Initialize useNavigate

  // Function to fetch users from Firestore based on the search query
  useEffect(() => {
    const fetchUsers = async () => {
      if (!searchQuery.trim()) {
        setFilteredUsers([]);
        return;
      }

      const usersRef = collection(firestore, 'users');
      const q = query(
        usersRef,
        where('username', '>=', searchQuery.toLowerCase()), // Convert search query to lowercase
        where('username', '<=', searchQuery.toLowerCase() + '\uf8ff')
      );

      const querySnapshot = await getDocs(q);
      const usersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      setFilteredUsers(usersData);
    };

    fetchUsers();
  }, [searchQuery, firestore]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    setShowSuggestions(value.trim() !== '');
  };

  const handleUserSelect = (userId) => {
    // Redirect to the selected user's profile page using navigate
    navigate(`/user/${userId}`);
    setShowSuggestions(false);
  };

  return (
<div className="relative w-full max-w-md mx-auto dark:bg-black">
<div className="flex items-center bg-white border-2 border-black rounded-lg p-3 shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105 focus-within:ring-2 focus-within:ring-black dark:bg-gray-800 dark:border-gray-600 dark:focus-within:ring-white">
        <AiOutlineSearch size={24} color="#000" />
        <input
          type="text"
          placeholder="Search users..."
          value={searchQuery}
          onChange={handleInputChange}
          className="w-full bg-transparent text-black text-sm px-3 py-2 ml-2 rounded-md placeholder-gray-500 outline-none transition-all duration-300 ease-in-out focus:ring-2 focus:ring-black dark:text-white dark:placeholder-gray-400 dark:focus:ring-white"
          />
      </div>

      {showSuggestions && filteredUsers.length > 0 && (
        <ul className="absolute left-0 right-0 bg-white border-2 border-black rounded-lg shadow-xl mt-2 max-h-60 overflow-y-auto z-10">
          {filteredUsers.map((user) => (
            <li
              key={user.id}
              onClick={() => handleUserSelect(user.id)}
              className="flex items-center p-3 hover:bg-gray-100 cursor-pointer transition-colors duration-200 ease-in-out"
            >
              <img
                src={user.avatar}
                alt={`${user.username}'s avatar`}
                className="w-12 h-12 rounded-full mr-4 transform transition-all duration-300 ease-in-out hover:scale-105"
              />
              <span className="font-medium text-gray-800">@{user.username}</span>
            </li>
          ))}
        </ul>
      )}

      {showSuggestions && filteredUsers.length === 0 && (
        <div className="absolute left-0 right-0 bg-white border-2 border-black rounded-lg shadow-xl mt-2 p-3 text-gray-500 text-center">
          No users found
        </div>
      )}
    </div>
  );
};

export default SearchBar;
