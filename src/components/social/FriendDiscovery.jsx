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
  getDoc, 
  arrayUnion, 
  arrayRemove,
  Timestamp
} from 'firebase/firestore';
import { auth, db } from '../firebaseConfig'; // Updated path
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';

const FriendDiscovery = ({ currentUser: passedUser }) => {
  const [discoveryMode, setDiscoveryMode] = useState('all');
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [connectingUsers, setConnectingUsers] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(passedUser);
  const navigate = useNavigate();

  // Get current user directly from auth if not passed as prop
  useEffect(() => {
    console.log("FriendDiscovery initialized with passedUser:", passedUser?.uid);
    
    // If we already have a user from props, use it
    if (passedUser?.uid) {
      console.log("Using passed user:", passedUser.uid);
      setCurrentUser(passedUser);
      return;
    }
    
    console.log("No passed user, checking auth directly");
    
    // Otherwise, listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        console.log("Auth user found:", user.uid);
        try {
          // Get full user data from Firestore
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = { id: user.uid, ...userDoc.data() };
            console.log("User data fetched from Firestore:", userData.id);
            setCurrentUser(userData);
          } else {
            console.log("User document not found in Firestore");
            // Fallback to basic auth user
            setCurrentUser({
              id: user.uid,
              fullName: user.displayName || 'User',
              email: user.email,
            });
          }
        } catch (err) {
          console.error("Error fetching user data:", err);
          setError("Failed to load user data: " + err.message);
          // Fallback to basic auth user
          setCurrentUser({
            id: user.uid,
            fullName: user.displayName || 'User',
            email: user.email,
          });
        }
      } else {
        console.log("No authenticated user");
        setCurrentUser(null);
      }
    });
    
    return () => unsubscribe();
  }, [passedUser]);

  // Watch for changes to currentUser
  useEffect(() => {
    console.log("Current user updated:", currentUser?.uid);
  }, [currentUser]);

  // Fetch suggested users from Firestore based on discovery mode
  const fetchSuggestedUsers = async () => {
    if (!currentUser?.id && !currentUser?.uid) {
      console.log("No current user ID for fetching users");
      setLoading(false);
      setSuggestedUsers([]); // Clear any existing data
      return;
    }
    
    const userId = currentUser.id || currentUser.uid;
    console.log("Fetching suggested users for:", userId);
    
    setLoading(true);
    setError(null);
    
    try {
      console.log("Starting Firestore query");
      const usersRef = collection(db, 'users');
      let usersQuery;
      
      // Use a simpler query to debug initial loading issues
      usersQuery = query(
        usersRef,
        where('__name__', '!=', userId),
        limit(10)
      );
      
      console.log("Executing query...");
      const querySnapshot = await getDocs(usersQuery);
      console.log(`Query returned ${querySnapshot.size} users`);
      
      // Simple transformation - avoid complex async operations for now
      const users = querySnapshot.docs.map(doc => {
        return {
          id: doc.id,
          ...doc.data(),
          // Default isFollowing for now to avoid additional queries
          isFollowing: false 
        };
      });
      
      console.log(`Processed ${users.length} users`);
      setSuggestedUsers(users);
    } catch (error) {
      console.error('Error fetching suggested users:', error);
      setError(`Failed to load users: ${error.message}`);
      setSuggestedUsers([]); // Clear on error
    } finally {
      setLoading(false);
    }
  };

  // Fix dependency array and add cleanup
  useEffect(() => {
    let isMounted = true;
    
    if (!isSearching && (currentUser?.id || currentUser?.uid)) {
      console.log("Triggering user fetch");
      fetchSuggestedUsers()
        .then(() => {
          if (isMounted) {
            console.log("Fetch completed successfully");
          }
        })
        .catch(err => {
          if (isMounted) {
            console.error("Fetch failed:", err);
            setLoading(false);
          }
        });
    } else if (!currentUser?.id && !currentUser?.uid) {
      // Reset loading state if no user
      console.log("No user ID, resetting loading state");
      setLoading(false);
    }
    
    return () => {
      isMounted = false;
    };
  }, [discoveryMode, currentUser?.id, currentUser?.uid, isSearching]);

  // Simplified follow status check that won't block rendering
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

  // Simplified search that won't get stuck
  const searchUsers = async (searchQuery) => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setSearchLoading(true);
    setIsSearching(true);

    try {
      const searchLower = searchQuery.toLowerCase();
      
      // Simple query without complex filtering
      const usersRef = collection(db, 'users');
      const querySnapshot = await getDocs(query(usersRef, limit(20)));
      
      // Filter client-side for simple search
      const results = querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(user => 
          user.id !== (currentUser?.id || currentUser?.uid) && 
          ((user.fullName && user.fullName.toLowerCase().includes(searchLower)) ||
           (user.username && user.username.toLowerCase().includes(searchLower)))
        )
        .map(user => ({
          ...user,
          isFollowing: false // Default value to avoid loading delays
        }));

      setSearchResults(results);
    } catch (error) {
      console.error('Error searching users:', error);
      setError(`Search failed: ${error.message}`);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // Debounced search with cleanup
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    
    const timeoutId = setTimeout(() => {
      searchUsers(searchTerm);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Simplified connect function
  const handleConnect = async (userId, isFollowing) => {
    const currentUserId = currentUser?.id || currentUser?.uid;
    if (!currentUserId) return;
    
    setConnectingUsers(prev => new Set([...prev, userId]));
    
    try {
      if (!isFollowing) {
        // Follow user
        await addDoc(collection(db, 'follows'), {
          followerId: currentUserId,
          followingId: userId,
          createdAt: Timestamp.now()
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
        // Unfollow user
        const followQuery = query(
          collection(db, 'follows'),
          where('followerId', '==', currentUserId),
          where('followingId', '==', userId)
        );
        
        const followSnapshot = await getDocs(followQuery);
        
        if (!followSnapshot.empty) {
          await deleteDoc(followSnapshot.docs[0].ref);
          
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
    } catch (error) {
      console.error('Error connecting with user:', error);
      setError(`Connection failed: ${error.message}`);
    } finally {
      setConnectingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  // Message functionality
  const handleMessage = async (userId) => {
    const currentUserId = currentUser?.id || currentUser?.uid;
    if (!currentUserId) return;
    
    try {
      // Check if chat room already exists
      const chatRoomsRef = collection(db, 'chatRooms');
      const q = query(
        chatRoomsRef,
        where('users', 'array-contains', currentUserId)
      );
      
      const querySnapshot = await getDocs(q);
      let existingChatRoom = null;
      
      querySnapshot.forEach(doc => {
        const data = doc.data();
        if (data.users && data.users.includes(userId)) {
          existingChatRoom = { id: doc.id, ...data };
        }
      });
      
      if (existingChatRoom) {
        console.log("Navigating to existing chat:", existingChatRoom.id);
        navigate(`/chat/${existingChatRoom.id}`);
      } else {
        // Create a new chat room with users array (not participants)
        const newChatRoomRef = await addDoc(chatRoomsRef, {
          users: [currentUserId, userId],
          createdAt: Timestamp.now(),
          lastMessage: null,
          lastMessageTimestamp: null
        });
        
        console.log("Created new chat room:", newChatRoomRef.id);
        navigate(`/chat/${newChatRoomRef.id}`);
      }
      
      // Add haptic feedback if supported
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    } catch (error) {
      console.error('Error starting chat:', error);
      setError(`Failed to start chat: ${error.message}`);
    }
  };

  // Simplified wave function
  const handleWave = (userId) => {
    console.log(`Waved to user: ${userId}`);
    if (navigator.vibrate) {
      navigator.vibrate(50);
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
        {/* Auth status */}
        {!currentUser?.id && !currentUser?.uid && (
          <div className="mb-4 p-3 bg-yellow-100 dark:bg-yellow-900/40 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-yellow-800 dark:text-yellow-300 text-sm">
              You need to log in to see personalized suggestions
            </p>
          </div>
        )}
        
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
                onClick={() => navigate('/explore')}
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
                : (currentUser?.id || currentUser?.uid)
                  ? 'Check back later for new connection suggestions'
                  : 'Log in to discover people'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

const UserCard = ({ user, mode, onConnect, onMessage, onWave, isConnecting, currentUser }) => {
  // Calculate if users have mutual interests - with safeguards
  const getMutualInterests = () => {
    if (!user?.interests?.length || !currentUser?.interests?.length) return [];
    
    return user.interests.filter(interest => 
      currentUser.interests.includes(interest)
    );
  };

  const mutualInterests = getMutualInterests();
  const hasMutualCollege = user?.college && currentUser?.college && user.college === currentUser.college;
  
  // Safely access user properties
  const photoURL = user?.photoURL || user?.avatar;
  const fullName = user?.fullName || user?.displayName || 'Unknown User';
  const username = user?.username || 'user';
  
  // State to track if image failed to load
  const [imageError, setImageError] = useState(false);

  return (
    <div className="flex items-start space-x-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200">
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <div className="w-14 h-14 rounded-xl overflow-hidden ring-2 ring-gray-200 dark:ring-gray-700">
          {photoURL && !imageError ? (
            <img
              src={photoURL}
              alt={fullName}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
              {fullName[0].toUpperCase()}
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
              {fullName}
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
              @{username}
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

          {user?.bio && (
            <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
              {user.bio}
            </p>
          )}

          {user?.course && (
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