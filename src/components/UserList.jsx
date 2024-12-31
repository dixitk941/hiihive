import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, limit, startAfter } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { useNavigate } from 'react-router-dom';
import InfiniteScroll from 'react-infinite-scroll-component';
import SearchBar from './SearchBar';
import loaderGif from '../assets/normload.gif'; // Adjust the path according to your project structure

const UsersList = () => {
  const [users, setUsers] = useState([]);
  const [lastVisible, setLastVisible] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [userIds, setUserIds] = useState(new Set()); // Track user IDs to prevent duplicates
  const navigate = useNavigate();

  const fetchUsers = async (fetchMore = false) => {
    try {
      const usersQuery = query(
        collection(db, 'users'),
        ...(fetchMore && lastVisible ? [startAfter(lastVisible)] : []),
        limit(10)
      );

      const querySnapshot = await getDocs(usersQuery);

      if (querySnapshot.empty) {
        setHasMore(false);
        return;
      }

      const fetchedUsers = [];
      querySnapshot.docs.forEach((doc) => {
        const userData = { id: doc.id, ...doc.data() };
        if (!userIds.has(userData.id)) {
          fetchedUsers.push(userData);
        }
      });

      setUsers((prevUsers) => [...prevUsers, ...fetchedUsers]);
      setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
      setUserIds((prevUserIds) => {
        const newIds = new Set(prevUserIds);
        fetchedUsers.forEach((user) => newIds.add(user.id));
        return newIds;
      });
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
<div className="p-4 bg-gray-100 min-h-screen dark:bg-black">
<SearchBar />
      <h1 className="text-xl sm:text-2xl font-semibold mb-4">Available Users</h1>
      <InfiniteScroll
        dataLength={users.length}
        next={() => fetchUsers(true)}
        hasMore={hasMore}
        loader={
          <div className="flex justify-center">
            <img src={loaderGif} alt="Loading" className="w-16 h-16" />
          </div>
        }
        endMessage={
          <p className="text-center text-gray-500 mt-4">No more users to display.</p>
        }
      >
<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 dark:bg-black">
{users.map((user) => (
            <div
              key={user.id}
              className="flex flex-col items-center p-4 bg-white shadow rounded-lg"
            >
              <div className="w-16 h-16 rounded-full bg-gray-400 flex items-center justify-center text-xl font-bold text-white overflow-hidden">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={`${user.fullName}'s avatar`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{user.username ? user.username[0].toUpperCase() : ''}</span>
                )}
              </div>
              <div className="text-center mt-2">
                <h2 className="text-lg font-semibold">{user.fullName}</h2>
                <p className="text-gray-500 text-sm">@{user.username}</p>
              </div>
              <button
                onClick={() => navigate(`/user/${user.id}`)}
                className="mt-2 px-4 py-2 text-sm font-semibold bg-gray-300 rounded-full hover:bg-gray-400 transition-colors duration-200 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white"
                >
                View Profile
              </button>
            </div>
          ))}
        </div>
      </InfiniteScroll>
    </div>
  );
};

export default UsersList;
