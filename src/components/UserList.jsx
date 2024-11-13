import React, { useEffect, useState } from 'react';
import { collection, getDocs, updateDoc, doc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { RotateLoader } from 'react-spinners';


const UsersList = ({ currentUser }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(new Set());

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const querySnapshot = await getDocs(collection(db, 'users'));
        const usersData = querySnapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data()
          }))
          .filter((user) => user.id !== currentUser.id); // Exclude current user

        setUsers(usersData);
        setFollowing(new Set(currentUser.following?.map(f => f.id) || [])); // Preload followed users
      } catch (error) {
        console.error("Error fetching users: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [currentUser]);

  const handleFollowToggle = async (userId, fullName) => {
    const isFollowing = following.has(userId);
    const currentUserRef = doc(db, 'users', currentUser.id);
    const followedUserRef = doc(db, 'users', userId);

    try {
      if (isFollowing) {
        // Unfollow
        await updateDoc(currentUserRef, {
          following: arrayRemove({ id: userId, fullName })
        });
        await updateDoc(followedUserRef, {
          followers: arrayRemove(currentUser.id)
        });
        setFollowing((prev) => {
          const updated = new Set(prev);
          updated.delete(userId); // Remove the userId from the Set
          return updated;
        });
      } else {
        // Follow
        await updateDoc(currentUserRef, {
          following: arrayUnion({ id: userId, fullName })
        });
        await updateDoc(followedUserRef, {
          followers: arrayUnion(currentUser.id)
        });
        setFollowing((prev) => new Set(prev).add(userId)); // Add the userId to the Set
      }
    } catch (error) {
      console.error("Error toggling follow status: ", error);
    }
  };

   if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <RotateLoader color="#36d7b7" />
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-semibold mb-4">Available Users</h1>
      <div className="space-y-4">
        {users.map((user) => (
          <div key={user.id} className="flex items-center space-x-4 p-3 bg-white shadow rounded-lg">
            <div className="w-12 h-12 rounded-full bg-gray-400 flex items-center justify-center text-xl font-bold text-white overflow-hidden">
              {user.avatar ? (
                <img src={user.avatar} alt={`${user.fullName}'s avatar`} className="w-full h-full object-cover" />
              ) : (
                <span>{user.username[0].toUpperCase()}</span>
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold">{user.fullName}</h2>
              <p className="text-gray-500">@{user.username}</p>
            </div>
            <button
              onClick={() => handleFollowToggle(user.id, user.fullName)}
              className={`px-4 py-2 text-sm font-semibold rounded-full ${
                following.has(user.id) ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
              } hover:bg-blue-600 transition-colors duration-200`}
            >
              {following.has(user.id) ? 'Following' : 'Follow'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UsersList;