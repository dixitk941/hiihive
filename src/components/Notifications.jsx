import React, { useState, useEffect } from 'react';
import { db } from './firebaseConfig';
import { collection, onSnapshot, doc, updateDoc, getDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBell, 
  faHeart, 
  faComment, 
  faUserPlus, 
  faShare, 
  faEye,
  faTrash,
  faCheck,
  faCheckDouble,
  faArrowLeft,
  faFilter,
  faCog
} from '@fortawesome/free-solid-svg-icons';
import { Link, useNavigate } from 'react-router-dom';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [selectedNotifications, setSelectedNotifications] = useState(new Set());
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [userDetails, setUserDetails] = useState({});
  
  const navigate = useNavigate();

  // Dark mode detection
  useEffect(() => {
    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDarkMode(prefersDarkMode);

    const handleThemeChange = (e) => {
      setIsDarkMode(e.matches);
    };

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', handleThemeChange);

    return () => {
      mediaQuery.removeEventListener('change', handleThemeChange);
    };
  }, []);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        setUser(null);
        navigate('/login');
      }
      setLoading(false);
    });

    return () => unsubscribeAuth();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      const notificationsRef = collection(db, `users/${user.uid}/notifications`);
      const q = query(notificationsRef, orderBy('timestamp', 'desc'));
      
      const unsubscribe = onSnapshot(q, async (snapshot) => {
        if (!snapshot.empty) {
          const notificationsData = await Promise.all(
            snapshot.docs.map(async (docSnap) => {
              const data = docSnap.data();
              
              // Fetch user details if notification involves another user
              let fromUserData = {};
              if (data.fromUserId) {
                try {
                  const userDoc = await getDoc(doc(db, 'users', data.fromUserId));
                  if (userDoc.exists()) {
                    fromUserData = userDoc.data();
                  }
                } catch (error) {
                  console.error('Error fetching user data:', error);
                }
              }

              return {
                id: docSnap.id,
                ...data,
                fromUser: fromUserData,
                timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : new Date()
              };
            })
          );
          
          setNotifications(notificationsData);
        } else {
          setNotifications([]);
        }
        setLoading(false);
      }, (error) => {
        console.error('Error fetching notifications:', error);
        setLoading(false);
      });

      return () => unsubscribe();
    }
  }, [user]);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'like':
        return { icon: faHeart, color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-900/30' };
      case 'comment':
        return { icon: faComment, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30' };
      case 'follow':
        return { icon: faUserPlus, color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-900/30' };
      case 'share':
        return { icon: faShare, color: 'text-purple-500', bg: 'bg-purple-100 dark:bg-purple-900/30' };
      default:
        return { icon: faBell, color: 'text-gray-500', bg: 'bg-gray-100 dark:bg-gray-800' };
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const markAsSeen = async (notificationId) => {
    try {
      const notificationRef = doc(db, `users/${user.uid}/notifications/${notificationId}`);
      await updateDoc(notificationRef, { seen: true });
    } catch (error) {
      console.error('Error marking notification as seen:', error);
    }
  };

  const markAllAsSeen = async () => {
    const unseenNotifications = notifications.filter(n => !n.seen);
    const promises = unseenNotifications.map(notification => 
      markAsSeen(notification.id)
    );
    await Promise.all(promises);
  };

  const deleteNotification = async (notificationId) => {
    try {
      const notificationRef = doc(db, `users/${user.uid}/notifications/${notificationId}`);
      await deleteDoc(notificationRef);
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const deleteSelectedNotifications = async () => {
    const promises = Array.from(selectedNotifications).map(id => deleteNotification(id));
    await Promise.all(promises);
    setSelectedNotifications(new Set());
  };

  const handleNotificationClick = (notification) => {
    if (!notification.seen) {
      markAsSeen(notification.id);
    }

    // Navigate based on notification type
    if (notification.postId) {
      navigate(`/post/${notification.postId}`);
    } else if (notification.fromUserId) {
      navigate(`/user/${notification.fromUserId}`);
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.seen;
    if (filter === 'read') return notification.seen;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.seen).length;
  if (loading) {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'bg-black' : 'bg-gray-50'} p-4`}>
        <div className="max-w-3xl mx-auto">
          {/* Header skeleton */}
          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-4 shadow-sm flex justify-between items-center mb-4 animate-pulse`}>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-40"></div>
            <div className="w-24 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          </div>
          
          {/* Notification items skeleton */}
          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-sm overflow-hidden`}>
            {[...Array(8)].map((_, i) => (
              <div key={i} className="p-4 border-b border-gray-100 dark:border-gray-700 animate-pulse">
                <div className="flex">
                  <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 mr-4"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                  </div>
                  <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded-full ml-2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Header */}
      <div className={`sticky top-0 z-10 ${isDarkMode ? 'bg-black/95 border-gray-800' : 'bg-white/95 border-gray-200'} backdrop-blur-md border-b`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
              >
                <FontAwesomeIcon icon={faArrowLeft} className="text-xl" />
              </button>
              <div>
                <h1 className="text-2xl font-bold">Notifications</h1>
                {unreadCount > 0 && (
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsSeen}
                  className="flex items-center space-x-2 text-blue-500 hover:text-blue-600 transition-colors"
                >
                  <FontAwesomeIcon icon={faCheckDouble} />
                  <span className="hidden sm:inline text-sm font-medium">Mark all read</span>
                </button>
              )}
              
              {selectedNotifications.size > 0 && (
                <button
                  onClick={deleteSelectedNotifications}
                  className="flex items-center space-x-2 text-red-500 hover:text-red-600 transition-colors"
                >
                  <FontAwesomeIcon icon={faTrash} />
                  <span className="hidden sm:inline text-sm font-medium">Delete selected</span>
                </button>
              )}
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex space-x-6 pb-4">
            {[
              { key: 'all', label: 'All', count: notifications.length },
              { key: 'unread', label: 'Unread', count: unreadCount },
              { key: 'read', label: 'Read', count: notifications.length - unreadCount }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`flex items-center space-x-2 pb-2 border-b-2 transition-colors ${
                  filter === tab.key
                    ? 'border-blue-500 text-blue-500'
                    : `border-transparent ${isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-800'}`
                }`}
              >
                <span className="font-medium">{tab.label}</span>
                {tab.count > 0 && (
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    filter === tab.key
                      ? 'bg-blue-500 text-white'
                      : `${isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-200 text-gray-600'}`
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-12">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
              <FontAwesomeIcon icon={faBell} className={`text-4xl ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
            </div>
            <h3 className={`text-xl font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              {filter === 'unread' ? 'No unread notifications' : 
               filter === 'read' ? 'No read notifications' : 'No notifications yet'}
            </h3>
            <p className={`${isDarkMode ? 'text-gray-500' : 'text-gray-500'} max-w-md mx-auto`}>
              {filter === 'all' 
                ? "When you get notifications, they'll show up here."
                : `You don't have any ${filter} notifications.`
              }
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notification) => {
              const iconData = getNotificationIcon(notification.type);
              
              return (
                <div
                  key={notification.id}
                  className={`group relative rounded-2xl transition-all duration-300 hover:scale-[1.02] cursor-pointer ${
                    notification.seen
                      ? `${isDarkMode ? 'bg-gray-900 hover:bg-gray-800' : 'bg-white hover:bg-gray-50'} border ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`
                      : `${isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-blue-50 hover:bg-blue-100'} border-2 ${isDarkMode ? 'border-blue-800' : 'border-blue-200'}`
                  } shadow-sm hover:shadow-md`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="p-6">
                    <div className="flex items-start space-x-4">
                      {/* Notification Icon */}
                      <div className={`flex-shrink-0 w-12 h-12 rounded-full ${iconData.bg} flex items-center justify-center`}>
                        <FontAwesomeIcon icon={iconData.icon} className={`text-lg ${iconData.color}`} />
                      </div>

                      {/* User Avatar (if applicable) */}
                      {notification.fromUser?.avatar && (
                        <img
                          src={notification.fromUser.avatar}
                          alt={notification.fromUser.username}
                          className="w-12 h-12 rounded-full object-cover ring-2 ring-white dark:ring-gray-800"
                        />
                      )}

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'} leading-relaxed`}>
                              {notification.message}
                            </p>
                            <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              {formatTimeAgo(notification.timestamp)}
                            </p>
                          </div>
                          
                          <div className="flex items-center space-x-2 ml-4">
                            {!notification.seen && (
                              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                            )}
                            
                            {/* Action Buttons */}
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-2">
                              {!notification.seen && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    markAsSeen(notification.id);
                                  }}
                                  className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
                                  title="Mark as read"
                                >
                                  <FontAwesomeIcon icon={faEye} className="text-sm" />
                                </button>
                              )}
                              
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteNotification(notification.id);
                                }}
                                className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-red-900/30' : 'hover:bg-red-100'} text-red-500`}
                                title="Delete notification"
                              >
                                <FontAwesomeIcon icon={faTrash} className="text-sm" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;