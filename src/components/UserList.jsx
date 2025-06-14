import React, { useEffect, useState } from 'react';
import { 
  collection, 
  getDocs, 
  query, 
  limit, 
  startAfter, 
  where, 
  orderBy, 
  addDoc,  // Added missing import
  deleteDoc // Added missing import
} from 'firebase/firestore';
import { db } from './firebaseConfig';
import { useNavigate } from 'react-router-dom';
import InfiniteScroll from 'react-infinite-scroll-component';
import SearchBar from './SearchBar';
import { FiUser, FiUserPlus, FiMessageCircle, FiMoreVertical, FiMapPin, FiCalendar } from 'react-icons/fi';

const UsersList = ({ currentUser }) => {
  const [users, setUsers] = useState([]);
  const [lastVisible, setLastVisible] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [userIds, setUserIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [userStats, setUserStats] = useState({});
  const navigate = useNavigate();

  // Fetch user statistics
  const fetchUserStats = async (userId) => {
    try {
      const [postsSnapshot, followersSnapshot, followingSnapshot] = await Promise.all([
        // Get posts count
        getDocs(query(collection(db, 'posts'), where('userId', '==', userId))),
        // Get followers count
        getDocs(query(collection(db, 'follows'), where('followingId', '==', userId))),
        // Get following count
        getDocs(query(collection(db, 'follows'), where('followerId', '==', userId)))
      ]);

      return {
        postsCount: postsSnapshot.size,
        followersCount: followersSnapshot.size,
        followingCount: followingSnapshot.size
      };
    } catch (error) {
      console.error('Error fetching user stats:', error);
      return {
        postsCount: 0,
        followersCount: 0,
        followingCount: 0
      };
    }
  };

  // Check if current user is following this user
  const checkFollowStatus = async (userId) => {
    if (!currentUser?.id) return false;
    
    try {
      const followQuery = query(
        collection(db, 'follows'),
        where('followerId', '==', currentUser.id),
        where('followingId', '==', userId)
      );
      const followSnapshot = await getDocs(followQuery);
      return !followSnapshot.empty;
    } catch (error) {
      console.error('Error checking follow status:', error);
      return false;
    }
  };

  const fetchUsers = async (fetchMore = false) => {
    try {
      const usersQuery = query(
        collection(db, 'users'),
        orderBy('createdAt', 'desc'),
        ...(fetchMore && lastVisible ? [startAfter(lastVisible)] : []),
        limit(12)
      );

      const querySnapshot = await getDocs(usersQuery);

      if (querySnapshot.empty) {
        setHasMore(false);
        setLoading(false);
        return;
      }

      const fetchedUsers = [];
      const statsPromises = [];
      const followStatusPromises = [];

      querySnapshot.docs.forEach((doc) => {
        const userData = { id: doc.id, ...doc.data() };
        if (!userIds.has(userData.id) && userData.id !== currentUser?.id) {
          fetchedUsers.push(userData);
          statsPromises.push(fetchUserStats(userData.id));
          followStatusPromises.push(checkFollowStatus(userData.id));
        }
      });

      // Fetch all stats in parallel
      const [statsResults, followStatusResults] = await Promise.all([
        Promise.all(statsPromises),
        Promise.all(followStatusPromises)
      ]);

      // Combine users with their stats and follow status
      const usersWithStats = fetchedUsers.map((user, index) => ({
        ...user,
        stats: statsResults[index],
        isFollowing: followStatusResults[index]
      }));

      setUsers((prevUsers) => [...prevUsers, ...usersWithStats]);
      setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
      setUserIds((prevUserIds) => {
        const newIds = new Set(prevUserIds);
        fetchedUsers.forEach((user) => newIds.add(user.id));
        return newIds;
      });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching users:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchUsers();
    }
  }, [currentUser]);

  const handleMessageUser = (userId, e) => {
    e.stopPropagation();
    navigate(`/chat/${userId}`);
  };

  const handleFollowUser = async (userId, e) => {
    e.stopPropagation();
    
    if (!currentUser?.id) return;

    try {
      const followRef = collection(db, 'follows');
      const followQuery = query(
        followRef,
        where('followerId', '==', currentUser.id),
        where('followingId', '==', userId)
      );
      
      const existingFollow = await getDocs(followQuery);
      
      if (existingFollow.empty) {
        // Follow user
        await addDoc(followRef, {
          followerId: currentUser.id,
          followingId: userId,
          createdAt: new Date()
        });
        
        // Update local state
        setUsers(prevUsers =>
          prevUsers.map(user =>
            user.id === userId
              ? {
                  ...user,
                  isFollowing: true,
                  stats: {
                    ...user.stats,
                    followersCount: user.stats.followersCount + 1
                  }
                }
              : user
          )
        );
      } else {
        // Unfollow user
        await deleteDoc(existingFollow.docs[0].ref);
        
        // Update local state
        setUsers(prevUsers =>
          prevUsers.map(user =>
            user.id === userId
              ? {
                  ...user,
                  isFollowing: false,
                  stats: {
                    ...user.stats,
                    followersCount: Math.max(0, user.stats.followersCount - 1)
                  }
                }
              : user
          )
        );
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Recently';
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.getFullYear();
    } catch (error) {
      return 'Recently';
    }
  };

  const UserCard = ({ user, index }) => (
    <div 
      key={user.id}
      className="group bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden hover:shadow-xl dark:hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] hover:border-blue-200 dark:hover:border-blue-800"
      style={{
        animationDelay: `${index * 50}ms`,
        animation: 'fadeInUp 0.6s ease-out forwards'
      }}
    >
      <div className="p-6">
        {/* User Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-4 flex-1">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-xl overflow-hidden ring-2 ring-blue-100 dark:ring-blue-900 group-hover:ring-blue-200 dark:group-hover:ring-blue-800 transition-all duration-300">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={`${user.fullName}'s avatar`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <span className={user.avatar ? 'hidden' : 'flex'}>
                  {user.fullName ? user.fullName[0].toUpperCase() : <FiUser size={24} />}
                </span>
              </div>
              {/* Online status indicator - could be enhanced with real online status */}
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-3 border-white dark:border-gray-900 shadow-sm"></div>
            </div>

            {/* User Info */}
            <div className="flex-1 min-w-0">
              <h3 className="text-lg lg:text-xl font-bold text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                {user.fullName || 'Unknown User'}
              </h3>
              <p className="text-sm lg:text-base text-gray-500 dark:text-gray-400 truncate mb-2">
                @{user.username || 'username'}
              </p>
              
              {/* Desktop: Show more info */}
              <div className="hidden lg:flex items-center space-x-4 text-xs text-gray-400 dark:text-gray-500">
                {user.location && (
                  <div className="flex items-center space-x-1">
                    <FiMapPin size={12} />
                    <span>{user.location}</span>
                  </div>
                )}
                <div className="flex items-center space-x-1">
                  <FiCalendar size={12} />
                  <span>Joined {formatDate(user.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Options Menu */}
          <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors opacity-0 group-hover:opacity-100">
            <FiMoreVertical size={18} className="text-gray-400" />
          </button>
        </div>

        {/* Bio */}
        {user.bio && (
          <div className="mb-4">
            <p className="text-sm lg:text-base text-gray-600 dark:text-gray-300 line-clamp-3 leading-relaxed">
              {user.bio}
            </p>
          </div>
        )}

        {/* Real Stats - Desktop Only */}
        {user.stats && (
          <div className="hidden lg:flex items-center space-x-6 mb-4 text-sm">
            <div className="flex items-center space-x-1">
              <span className="font-semibold text-gray-900 dark:text-white">
                {user.stats.postsCount}
              </span>
              <span className="text-gray-500 dark:text-gray-400">Posts</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="font-semibold text-gray-900 dark:text-white">
                {user.stats.followersCount}
              </span>
              <span className="text-gray-500 dark:text-gray-400">Followers</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="font-semibold text-gray-900 dark:text-white">
                {user.stats.followingCount}
              </span>
              <span className="text-gray-500 dark:text-gray-400">Following</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={() => navigate(`/user/${user.id}`)}
            className="flex-1 lg:flex-none lg:px-6 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium text-sm transition-all duration-200 flex items-center justify-center space-x-2 group/btn"
          >
            <FiUser size={16} className="group-hover/btn:scale-110 transition-transform" />
            <span>View Profile</span>
          </button>
          
          <button
            onClick={(e) => handleMessageUser(user.id, e)}
            className="flex-1 lg:flex-none lg:px-6 py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white rounded-xl font-medium text-sm transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl group/btn"
          >
            <FiMessageCircle size={16} className="group-hover/btn:scale-110 transition-transform" />
            <span>Message</span>
          </button>

          {/* Real Follow Button - Desktop Only */}
          <button 
            onClick={(e) => handleFollowUser(user.id, e)}
            className={`hidden lg:flex items-center justify-center px-6 py-3 rounded-xl font-medium text-sm transition-all duration-200 space-x-2 shadow-lg hover:shadow-xl group/btn ${
              user.isFollowing
                ? 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white'
            }`}
          >
            <FiUserPlus size={16} className="group-hover/btn:scale-110 transition-transform" />
            <span>{user.isFollowing ? 'Following' : 'Follow'}</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      {/* Enhanced Header Section */}
      <div className="sticky top-0 lg:top-0 z-10 bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800 backdrop-blur-md bg-opacity-95 dark:bg-opacity-95">
        <div className="px-4 lg:px-8 py-4 lg:py-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
                  Discover People
                </h1>
                <p className="text-sm lg:text-base text-gray-500 dark:text-gray-400 mt-1">
                  Connect with amazing people in the HiiHive community
                </p>
              </div>
              <div className="lg:max-w-md lg:w-full">
                <SearchBar />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 lg:px-8 py-6 lg:py-8">
        <div className="max-w-7xl mx-auto">
          {/* Enhanced Stats */}
          <div className="mb-6 lg:mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-2 lg:space-y-0">
              <p className="text-sm lg:text-base text-gray-500 dark:text-gray-400">
                {users.length > 0 && (
                  <>
                    Showing {users.length} user{users.length !== 1 ? 's' : ''}
                    {hasMore && ' • Loading more...'}
                  </>
                )}
              </p>
              
              {/* Filter Options - Desktop Only */}
              <div className="hidden lg:flex items-center space-x-4">
                <select className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option>All Users</option>
                  <option>Recently Joined</option>
                  <option>Most Active</option>
                  <option>Most Followed</option>
                </select>
              </div>
            </div>
          </div>

          {/* Users Grid */}
          <InfiniteScroll
            dataLength={users.length}
            next={() => fetchUsers(true)}
            hasMore={hasMore}            loader={
              <div className="flex justify-center py-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full max-w-3xl animate-pulse">
                  {[...Array(2)].map((_, i) => (
                    <div key={i} className="bg-white dark:bg-gray-900 rounded-xl p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            }
            endMessage={
              <div className="text-center py-12">
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-full flex items-center justify-center">
                    <FiUser size={32} className="text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      You've discovered everyone!
                    </p>
                    <p className="text-base text-gray-500 dark:text-gray-400">
                      Check back later for new community members
                    </p>
                  </div>
                </div>
              </div>
            }
          >
            {/* Responsive Grid - Better Desktop Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-6 lg:gap-8">
              {users.map((user, index) => (
                <UserCard key={user.id} user={user} index={index} />
              ))}
            </div>
          </InfiniteScroll>

          {/* Enhanced Loading Skeleton */}
          {loading && users.length === 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-6 lg:gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl p-6 animate-pulse">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-16 h-16 lg:w-20 lg:h-20 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                      <div className="hidden lg:block h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                    </div>
                  </div>
                  <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                  <div className="flex space-x-3">
                    <div className="flex-1 h-12 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                    <div className="flex-1 h-12 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                    <div className="hidden lg:block flex-1 h-12 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Enhanced CSS for animations */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .border-3 {
          border-width: 3px;
        }
      `}</style>
    </div>
  );
};

export default UsersList;