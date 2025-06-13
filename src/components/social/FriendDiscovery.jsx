import React, { useState, useEffect } from 'react';
import { FiUsers, FiUserPlus, FiUserCheck, FiMapPin, FiMessageCircle, FiSearch, FiX } from 'react-icons/fi';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  doc, 
  addDoc,
  deleteDoc,
  updateDoc, 
  arrayUnion, 
  arrayRemove 
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useNavigate } from 'react-router-dom';

const FriendDiscovery = ({ currentUser }) => {
  const [discoveryMode, setDiscoveryMode] = useState('all');
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [connectingUsers, setConnectingUsers] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Fetch suggested users from Firestore based on discovery mode
  const fetchSuggestedUsers = async () => {
    if (!currentUser?.uid) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const usersRef = collection(db, 'users');
      let usersQuery;
      
      // Determine query based on discovery mode
      switch(discoveryMode) {
        case 'college':
          // Users from same college
          usersQuery = query(
            usersRef,
            where('college', '==', currentUser.college || ''),
            where('__name__', '!=', currentUser.uid),
            limit(10)
          );
          break;
          
        case 'interests':
          // Basic query - we'll filter for interests client-side
          usersQuery = query(
            usersRef,
            where('__name__', '!=', currentUser.uid),
            limit(20)
          );
          break;
          
        case 'nearby':
          // Could implement with geolocation in the future
          usersQuery = query(
            usersRef,
            where('__name__', '!=', currentUser.uid),
            limit(10)
          );
          break;
          
        case 'mutual':
          // Basic query - we'll filter for mutual connections client-side
          usersQuery = query(
            usersRef,
            where('__name__', '!=', currentUser.uid),
            limit(20)
          );
          break;
          
        case 'all':
        default:
          usersQuery = query(
            usersRef,
            where('__name__', '!=', currentUser.uid),
            orderBy('createdAt', 'desc'),
            limit(10)
          );
          break;
      }
      
      const querySnapshot = await getDocs(usersQuery);
      
      // Transform the data and check follow status
      const usersPromises = querySnapshot.docs.map(async (userDoc) => {
        const userData = { id: userDoc.id, ...userDoc.data() };
        
        // Check if current user is following this user
        const followStatus = await checkFollowStatus(userData.id);
        
        return {
          ...userData,
          isFollowing: followStatus
        };
      });
      
      let users = await Promise.all(usersPromises);
      
      // Additional client-side filtering based on mode
      if (discoveryMode === 'interests' && currentUser.interests?.length > 0) {
        users = users.filter(user => 
          user.interests?.some(interest => 
            currentUser.interests.includes(interest)
          )
        );
      }
      
      if (discoveryMode === 'mutual' && currentUser.following?.length > 0) {
        users = users.filter(user => 
          user.following?.some(followedId => 
            currentUser.following.includes(followedId)
          )
        );
      }
      
      setSuggestedUsers(users);
    } catch (error) {
      console.error('Error fetching suggested users:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Check if current user is following this user
  const checkFollowStatus = async (userId) => {
    if (!currentUser?.uid) return false;
    
    try {
      const followQuery = query(
        collection(db, 'follows'),
        where('followerId', '==', currentUser.uid),
        where('followingId', '==', userId)
      );
      const followSnapshot = await getDocs(followQuery);
      return !followSnapshot.empty;
    } catch (error) {
      console.error('Error checking follow status:', error);
      return false;
    }
  };

  useEffect(() => {
    if (!isSearching && currentUser?.uid) {
      fetchSuggestedUsers();
    }
  }, [discoveryMode, currentUser, isSearching]);

  // Search functionality
  const searchUsers = async (searchQuery) => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setSearchLoading(true);
    setIsSearching(true);

    try {
      const usersRef = collection(db, 'users');
      const querySnapshot = await getDocs(usersRef);
      const results = [];
      
      querySnapshot.forEach(doc => {
        const userData = { id: doc.id, ...doc.data() };
        const searchLower = searchQuery.toLowerCase();
        
        if (
          (userData.fullName && userData.fullName.toLowerCase().includes(searchLower)) ||
          (userData.username && userData.username.toLowerCase().includes(searchLower))
        ) {
          if (userData.id !== currentUser?.uid) {
            results.push(userData);
          }
        }
      });

      // Check follow status for each search result
      const resultsWithFollowStatus = await Promise.all(
        results.map(async (user) => {
          const isFollowing = await checkFollowStatus(user.id);
          return { ...user, isFollowing };
        })
      );

      setSearchResults(resultsWithFollowStatus);
    } catch (error) {
      console.error('Error searching users:', error);
      setError(error.message);
    } finally {
      setSearchLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm) {
        searchUsers(searchTerm);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, currentUser]);

  // Connect (follow) user functionality
  const handleConnect = async (userId, isFollowing) => {
    if (!currentUser?.uid) return;
    
    setConnectingUsers(prev => new Set([...prev, userId]));
    
    try {
      const followRef = collection(db, 'follows');
      
      if (!isFollowing) {
        // Follow user
        await addDoc(followRef, {
          followerId: currentUser.uid,
          followingId: userId,
          createdAt: new Date()
        });
        
        // Update following array in current user document
        const currentUserRef = doc(db, 'users', currentUser.uid);
        await updateDoc(currentUserRef, {
          following: arrayUnion(userId)
        });
        
        // Update followers array in target user document
        const targetUserRef = doc(db, 'users', userId);
        await updateDoc(targetUserRef, {
          followers: arrayUnion(currentUser.uid)
        });
        
        // Update UI
        if (isSearching) {
          setSearchResults(prev => 
            prev.map(user => 
              user.id === userId ? { ...user, isFollowing: true } : user
            )
          );
        } else {
          setSuggestedUsers(prev => 
            prev.map(user => 
              user.id === userId ? { ...user, isFollowing: true } : user
            )
          );
        }
      } else {
        // Unfollow logic
        const followQuery = query(
          followRef,
          where('followerId', '==', currentUser.uid),
          where('followingId', '==', userId)
        );
        
        const followSnapshot = await getDocs(followQuery);
        
        if (!followSnapshot.empty) {
          await deleteDoc(followSnapshot.docs[0].ref);
          
          // Update following array in current user document
          const currentUserRef = doc(db, 'users', currentUser.uid);
          await updateDoc(currentUserRef, {
            following: arrayRemove(userId)
          });
          
          // Update followers array in target user document
          const targetUserRef = doc(db, 'users', userId);
          await updateDoc(targetUserRef, {
            followers: arrayRemove(currentUser.uid)
          });
          
          // Update UI
          if (isSearching) {
            setSearchResults(prev => 
              prev.map(user => 
                user.id === userId ? { ...user, isFollowing: false } : user
              )
            );
          } else {
            setSuggestedUsers(prev => 
              prev.map(user => 
                user.id === userId ? { ...user, isFollowing: false } : user
              )
            );
          }
        }
      }
      
      // Add haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    } catch (error) {
      console.error('Error connecting with user:', error);
    } finally {
      setConnectingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  // Message user functionality (similar to UserList)
  const handleMessage = async (userId) => {
    if (!currentUser?.uid) return;
    
    try {
      // Check if chat room already exists
      const chatRoomsRef = collection(db, 'chatRooms');
      const q = query(
        chatRoomsRef,
        where('users', 'array-contains', currentUser.uid)
      );
      
      const querySnapshot = await getDocs(q);
      let existingChatRoom = null;
      
      querySnapshot.forEach(doc => {
        const data = doc.data();
        if (data.users.includes(userId)) {
          existingChatRoom = { id: doc.id, ...data };
        }
      });
      
      if (existingChatRoom) {
        // Navigate to existing chat
        navigate(`/chat/${existingChatRoom.id}`);
      } else {
        // Create a new chat room
        const newChatRoomRef = await addDoc(chatRoomsRef, {
          users: [currentUser.uid, userId],
          messages: [],
          createdAt: new Date()
        });
        
        // Navigate to the new chat room
        navigate(`/chat/${newChatRoomRef.id}`);
      }
      
      // Add haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    } catch (error) {
      console.error('Error starting chat:', error);
    }
  };

  // Handle wave - simplified for now, could implement notification later
  const handleWave = (userId) => {
    if (!currentUser?.uid) return;
    
    // Could implement a notification to the user
    console.log(`Waved to user: ${userId}`);
    
    // Add haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate([50, 50, 50]);
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    setSearchResults([]);
    setIsSearching(false);
  };

  const discoveryModes = [
    { key: 'all', label: 'All Users', icon: '👥' },
    { key: 'college', label: 'College', icon: '🏫' },
    { key: 'interests', label: 'Interests', icon: '💝' },
    { key: 'nearby', label: 'Nearby', icon: '📍' },
    { key: 'mutual', label: 'Mutual', icon: '🤝' }
  ];

  const displayUsers = isSearching ? searchResults : suggestedUsers;
  const displayCount = isSearching ? searchResults.length : suggestedUsers.length;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 mb-6">
      {/* Header with Search */}
      <div className="px-5 py-5 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <FiUsers className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
            Discover People
          </h3>
          <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-lg">
            {displayCount} {isSearching ? 'results' : 'suggestions'}
          </span>
        </div>

        {/* Search Bar */}
        <div className="relative mb-4">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
            <input
              type="text"
              placeholder="Search people by name or username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
            />
            {searchTerm && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <FiX className="w-4 h-4" />
              </button>
            )}
          </div>
          
          {/* Search Loading Indicator */}
          {searchLoading && (
            <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>

        {/* Filter Tabs - Hidden during search */}
        {!isSearching && (
          <div className="relative">
            <div className="flex space-x-3 overflow-x-auto scrollbar-hide pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {discoveryModes.map(mode => (
                <button
                  key={mode.key}
                  onClick={() => setDiscoveryMode(mode.key)}
                  className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 flex-shrink-0 ${
                    discoveryMode === mode.key
                      ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 scale-105 shadow-sm'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                  style={{ minWidth: 'fit-content' }}
                >
                  <span className="text-base">{mode.icon}</span>
                  <span className="whitespace-nowrap">{mode.label}</span>
                </button>
              ))}
            </div>
            
            {/* Gradient fade for scroll indication */}
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white dark:from-gray-900 to-transparent pointer-events-none" />
          </div>
        )}

        {/* Search Status */}
        {isSearching && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              {searchLoading 
                ? 'Searching...' 
                : `${searchResults.length} result${searchResults.length !== 1 ? 's' : ''} for "${searchTerm}"`
              }
            </span>
            <button
              onClick={clearSearch}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
            >
              Clear search
            </button>
          </div>
        )}
      </div>

      {/* User List */}
      <div className="p-5">
        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/40 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-800 dark:text-red-300 text-sm">
              Error: {error}
            </p>
          </div>
        )}

        {loading ? (
          /* Loading State */
          <div className="space-y-4">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="flex items-start space-x-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl animate-pulse">
                <div className="w-14 h-14 bg-gray-300 dark:bg-gray-700 rounded-xl"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded mb-2 w-1/2"></div>
                  <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded mb-3 w-1/3"></div>
                  <div className="flex space-x-3">
                    <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded flex-1"></div>
                    <div className="h-8 w-12 bg-gray-300 dark:bg-gray-700 rounded"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : displayUsers.length > 0 ? (
          <>
            <div className="space-y-4">
              {displayUsers.slice(0, 4).map(user => (
                <UserCard 
                  key={user.id} 
                  user={user} 
                  mode={isSearching ? 'search' : discoveryMode}
                  onConnect={() => handleConnect(user.id, user.isFollowing)}
                  onMessage={() => handleMessage(user.id)}
                  onWave={() => handleWave(user.id)}
                  isConnecting={connectingUsers.has(user.id)}
                  currentUser={currentUser}
                />
              ))}
            </div>

            {/* View All Button */}
            {displayUsers.length > 4 && (
              <button 
                onClick={() => navigate('/users')}
                className="w-full mt-5 py-3 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all duration-200 border border-blue-200 dark:border-blue-800 hover:border-blue-300 dark:hover:border-blue-700"
              >
                {isSearching ? `View All ${searchResults.length} Results` : 'View All People'}
              </button>
            )}
          </>
        ) : (
          /* Empty State */
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              {isSearching ? (
                <FiSearch className="w-6 h-6 text-gray-400 dark:text-gray-500" />
              ) : (
                <FiUsers className="w-6 h-6 text-gray-400 dark:text-gray-500" />
              )}
            </div>
            <h4 className="text-gray-900 dark:text-white font-medium mb-2">
              {isSearching ? 'No users found' : 'No suggestions available'}
            </h4>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              {isSearching 
                ? `Try searching for a different name or username`
                : 'Check back later for new connection suggestions'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

const UserCard = ({ user, mode, onConnect, onMessage, onWave, isConnecting, currentUser }) => {
  // Calculate if users have mutual interests
  const getMutualInterests = () => {
    if (!user.interests || !currentUser?.interests) return [];
    
    return user.interests?.filter(interest => 
      currentUser.interests?.includes(interest)
    ) || [];
  };

  const mutualInterests = getMutualInterests();
  const hasMutualCollege = user.college && currentUser?.college && user.college === currentUser.college;

  return (
    <div className="flex items-start space-x-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200">
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <div className="w-14 h-14 rounded-xl overflow-hidden ring-2 ring-gray-200 dark:ring-gray-700">
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={user.fullName || 'User'}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
              {(user.fullName || 'U')[0].toUpperCase()}
            </div>
          )}
        </div>
        
        {/* Indicator based on mode */}
        {mode === 'search' && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center shadow-sm">
            <FiSearch className="w-3 h-3 text-white" />
          </div>
        )}
        
        {mode === 'college' && hasMutualCollege && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center shadow-sm">
            <span className="text-white text-xs">🏫</span>
          </div>
        )}
      </div>

      {/* User Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-gray-900 dark:text-white text-base truncate">
              {user.fullName || 'Unknown User'}
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
              @{user.username || 'username'}
            </p>
          </div>
        </div>

        {/* Mode-specific content */}
        <div className="mb-3">
          {mode === 'interests' && mutualInterests.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {mutualInterests.slice(0, 2).map(interest => (
                <span key={interest} className="bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 px-2.5 py-1 rounded-lg text-xs font-medium">
                  {interest}
                </span>
              ))}
              {mutualInterests.length > 2 && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  +{mutualInterests.length - 2} more
                </span>
              )}
            </div>
          )}
          
          {hasMutualCollege && (
            <div className="flex items-center space-x-2">
              <span className="text-base">🏫</span>
              <span className="text-sm text-purple-600 dark:text-purple-400 font-medium">
                {user.college}
              </span>
            </div>
          )}

          {user.bio && (
            <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
              {user.bio}
            </p>
          )}

          {user.course && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {user.course} • {user.year || 'Student'}
            </p>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex space-x-3">
          <button 
            onClick={onConnect}
            disabled={isConnecting}
            className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center space-x-2 shadow-sm hover:shadow-md transform hover:scale-[1.02] active:scale-95 ${
              user.isFollowing 
                ? 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
                : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 disabled:bg-blue-400 dark:disabled:bg-blue-500 text-white'
            }`}
          >
            {isConnecting ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                {user.isFollowing ? (
                  <>
                    <FiUserCheck className="w-4 h-4" />
                    <span>Following</span>
                  </>
                ) : (
                  <>
                    <FiUserPlus className="w-4 h-4" />
                    <span>Connect</span>
                  </>
                )}
              </>
            )}
          </button>
          
          <button 
            onClick={onMessage}
            className="px-3 py-2.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-sm"
          >
            <FiMessageCircle className="w-5 h-5" />
          </button>
          
          <button 
            onClick={onWave}
            className="px-3 py-2.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-sm"
          >
            <span className="text-base">👋</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default FriendDiscovery;