import React, { useState, useEffect } from 'react';
import { 
  FiSettings, 
  FiLogOut, 
  FiChevronLeft, 
  FiChevronRight, 
  FiHome, 
  FiMessageSquare, 
  FiUpload, 
  FiCompass, 
  FiUser
} from 'react-icons/fi';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebaseConfig';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

const SidebarLeft = ({ currentUser }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showLogoutWarning, setShowLogoutWarning] = useState(false);
  const [activeItem, setActiveItem] = useState('home');
  const [hoveredItem, setHoveredItem] = useState(null);
  const [user, setUser] = useState({
    displayName: '',
    avatar: '',
    username: '',
  });
  const [currentUserId, setCurrentUserId] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const firestore = getFirestore();

  // Clean navigation items
  const navigationItems = [
    { 
      id: 'home', 
      icon: FiHome, 
      label: 'Home', 
      path: '/',
      hoverColor: 'hover:bg-blue-50 dark:hover:bg-blue-900/20'
    },
    { 
      id: 'explore', 
      icon: FiCompass, 
      label: 'Explore', 
      path: '/explore',
      hoverColor: 'hover:bg-green-50 dark:hover:bg-green-900/20'
    },
    { 
      id: 'messages', 
      icon: FiMessageSquare, 
      label: 'Messages', 
      path: '/chatlist',
      hoverColor: 'hover:bg-pink-50 dark:hover:bg-pink-900/20'
    },
    { 
      id: 'profile', 
      icon: FiUser, 
      label: 'Profile', 
      path: '/profile',
      hoverColor: 'hover:bg-purple-50 dark:hover:bg-purple-900/20'
    }
  ];

  // Fetch user details from Firestore like in Header component
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setCurrentUserId(firebaseUser.uid);
        
        try {
          // Fetch user details from Firestore
          const userDocRef = doc(firestore, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUser({
              displayName: userData.fullName || firebaseUser.displayName || 'User',
              avatar: userData.avatar || firebaseUser.photoURL || '/default-avatar.png',
              username: userData.username || firebaseUser.email?.split('@')[0] || 'username',
            });
          } else {
            // Fallback to Firebase Auth data
            setUser({
              displayName: firebaseUser.displayName || 'User',
              avatar: firebaseUser.photoURL || '/default-avatar.png',
              username: firebaseUser.email?.split('@')[0] || 'username',
            });
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          // Fallback to Firebase Auth data on error
          setUser({
            displayName: firebaseUser.displayName || 'User',
            avatar: firebaseUser.photoURL || '/default-avatar.png',
            username: firebaseUser.email?.split('@')[0] || 'username',
          });
        }
      } else {
        setCurrentUserId(null);
        setUser({
          displayName: '',
          avatar: '',
          username: '',
        });
      }
    });

    return () => unsubscribe();
  }, [firestore]);

  // Set active item based on current path
  useEffect(() => {
    const currentPath = location.pathname;
    const currentItem = navigationItems.find(item => item.path === currentPath);
    if (currentItem) {
      setActiveItem(currentItem.id);
    }
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const toggleLogoutWarning = () => {
    setShowLogoutWarning(!showLogoutWarning);
  };

  const handleItemClick = (itemId) => {
    setActiveItem(itemId);
  };

  const handleProfileClick = () => {
    if (currentUserId) {
      navigate(`/user/${currentUserId}`);
    }
  };

  return (
    <>
      {/* Main Sidebar - Updated positioning */}
      <aside
        className={`hidden lg:flex fixed left-0 h-full 
          bg-white dark:bg-black
          flex-col shadow-xl border-r border-gray-200 dark:border-gray-800
          transition-all duration-300 ease-in-out z-30
          ${isCollapsed ? 'w-20' : 'w-72'}
          pt-16`}
        style={{ top: '0px' }}
      >
        {/* Header Section */}
        <div className="p-6 pb-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between">
            {!isCollapsed && (
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg">H</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    HiiHive
                  </h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Connect & Share</p>
                </div>
              </div>
            )}
            
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
            >
              {isCollapsed ? <FiChevronRight size={20} /> : <FiChevronLeft size={20} />}
            </button>
          </div>
        </div>

        {/* Enhanced User Profile Section - Similar to Header */}
        {!isCollapsed && currentUserId && (
          <div className="p-6 border-b border-gray-200 dark:border-gray-800">
            <div 
              onClick={handleProfileClick}
              className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 rounded-xl p-3 -m-3 transition-colors duration-200"
            >
              <div className="relative">
                <img
                  src={user.avatar || "/default-avatar.png"}
                  alt="Profile"
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-blue-100 dark:ring-blue-900 hover:ring-blue-200 dark:hover:ring-blue-800 transition-all duration-200"
                  onError={(e) => {
                    e.target.src = "/default-avatar.png";
                  }}
                />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white dark:border-black"></div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200">
                  {user.displayName || 'User'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  @{user.username || 'username'}
                </p>
              </div>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <FiUser size={16} className="text-gray-400 dark:text-gray-500" />
              </div>
            </div>
          </div>
        )}

        {/* Collapsed Profile Section */}
        {isCollapsed && currentUserId && (
          <div className="p-4 border-b border-gray-200 dark:border-gray-800">
            <div 
              onClick={handleProfileClick}
              className="relative cursor-pointer group"
              onMouseEnter={() => setHoveredItem('profile-avatar')}
              onMouseLeave={() => setHoveredItem(null)}
            >
              <img
                src={user.avatar || "/default-avatar.png"}
                alt="Profile"
                className="w-12 h-12 rounded-full object-cover ring-2 ring-blue-100 dark:ring-blue-900 hover:ring-blue-200 dark:hover:ring-blue-800 transition-all duration-200 mx-auto"
                onError={(e) => {
                  e.target.src = "/default-avatar.png";
                }}
              />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white dark:border-black"></div>
              
              {/* Tooltip for collapsed mode */}
              {hoveredItem === 'profile-avatar' && (
                <div className="absolute left-16 top-1/2 transform -translate-y-1/2 bg-gray-900 dark:bg-gray-700 text-white px-3 py-2 rounded-lg shadow-lg z-50 whitespace-nowrap">
                  <div className="text-sm font-medium">{user.displayName}</div>
                  <div className="text-xs text-gray-300">@{user.username}</div>
                  <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 dark:bg-gray-700 rotate-45"></div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Create Post Button */}
        <div className="p-4">
          <Link to="/upload" onClick={() => handleItemClick('upload')}>
            <button className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 flex items-center justify-center space-x-2">
              <FiUpload size={18} />
              {!isCollapsed && <span>Create Post</span>}
            </button>
          </Link>
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 px-4 py-2 space-y-2 overflow-y-auto">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeItem === item.id;
            const isHovered = hoveredItem === item.id;
            
            return (
              <Link
                key={item.id}
                to={item.path}
                onClick={() => handleItemClick(item.id)}
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
                className="block"
              >
                <div className={`
                  flex items-center p-3 rounded-xl transition-all duration-200 group relative
                  ${isActive 
                    ? 'bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 text-blue-600 dark:text-blue-400 shadow-sm' 
                    : item.hoverColor + ' text-gray-700 dark:text-gray-300'
                  }
                  ${isCollapsed ? 'justify-center' : ''}
                `}>
                  
                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-blue-500 to-purple-600 rounded-r-full"></div>
                  )}
                  
                  {/* Icon */}
                  <div className={`
                    p-2 rounded-lg transition-all duration-200
                    ${isActive 
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg' 
                      : 'group-hover:bg-white dark:group-hover:bg-gray-800 group-hover:shadow-md'
                    }
                  `}>
                    <Icon size={18} />
                  </div>
                  
                  {/* Label */}
                  {!isCollapsed && (
                    <span className="ml-3 font-medium">{item.label}</span>
                  )}
                  
                  {/* Hover tooltip for collapsed mode */}
                  {isCollapsed && isHovered && (
                    <div className="absolute left-16 bg-gray-900 dark:bg-gray-700 text-white px-3 py-2 rounded-lg shadow-lg z-50 whitespace-nowrap">
                      {item.label}
                      <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 dark:bg-gray-700 rotate-45"></div>
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800 space-y-2">
          {/* Settings */}
          <Link to="/settings">
            <button className={`
              w-full flex items-center p-3 rounded-xl transition-all duration-200
              hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300
              ${isCollapsed ? 'justify-center' : ''}
            `}>
              <div className="p-2 rounded-lg">
                <FiSettings size={18} />
              </div>
              {!isCollapsed && <span className="ml-3 font-medium">Settings</span>}
            </button>
          </Link>

          {/* Logout */}
          <button
            onClick={toggleLogoutWarning}
            className={`
              w-full flex items-center p-3 rounded-xl transition-all duration-200
              hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400
              ${isCollapsed ? 'justify-center' : ''}
            `}
          >
            <div className="p-2 rounded-lg">
              <FiLogOut size={18} />
            </div>
            {!isCollapsed && <span className="ml-3 font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Clean Logout Confirmation Modal */}
      {showLogoutWarning && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="bg-white dark:bg-black p-8 rounded-2xl shadow-2xl max-w-md w-full mx-4 border border-gray-200 dark:border-gray-800">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiLogOut className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Sign Out?
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                You can always sign back in at any time.
              </p>
              
              <div className="flex space-x-3">
                <button 
                  onClick={toggleLogoutWarning} 
                  className="flex-1 px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleLogout} 
                  className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors duration-200"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SidebarLeft;