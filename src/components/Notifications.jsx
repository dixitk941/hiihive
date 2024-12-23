import React, { useState, useEffect } from 'react';
import { db } from './firebaseConfig';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        console.log(`User is signed in: ${currentUser.uid}`);
        setUser(currentUser);
      } else {
        console.log('No user is signed in');
        setUser(null);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (user) {
      console.log(`Fetching notifications for user: ${user.uid}`);
      const notificationsRef = collection(
        db,
        `users/${user.uid}/notifications`
      );
      const unsubscribe = onSnapshot(
        notificationsRef,
        (snapshot) => {
          if (!snapshot.empty) {
            const notificationsData = snapshot.docs.map((doc) => {
              const data = doc.data();
              return {
                id: doc.id,
                ...data,
                // timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : null, // Commented timestamp conversion
              };
            });
            console.log('Fetched notifications:', notificationsData);
            setNotifications(notificationsData);
          } else {
            console.log('No notifications found');
          }
        },
        (error) => {
          console.error('Error fetching notifications:', error);
        }
      );

      return () => unsubscribe();
    }
  }, [user]);

  const markAsSeen = async (notificationId) => {
    try {
      const notificationRef = doc(
        db,
        `users/${user.uid}/notifications/${notificationId}`
      );
      await updateDoc(notificationRef, { seen: true });
      console.log(`Notification ${notificationId} marked as seen`);
    } catch (error) {
      console.error('Error marking notification as seen:', error);
    }
  };

  return (
    <div className="notifications-page-container bg-white text-gray-800 min-h-screen p-4 sm:p-5 md:p-6">
      <header className="header bg-gray-900 text-white py-4 px-6 rounded-lg shadow-md">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight">
          Notifications
        </h1>
      </header>

      <div className="content-container mt-4 sm:mt-6 md:mt-8">
        {notifications.length === 0 ? (
          <p className="text-center text-lg sm:text-xl text-gray-500">
            You have no notifications.
          </p>
        ) : (
          <ul className="notifications-list space-y-4">
            {notifications.map((notification) => (
              <li
                key={notification.id}
                className={`notification-item p-4 sm:p-5 md:p-6 rounded-lg shadow-md transform transition-all duration-200 ease-in-out hover:scale-105 ${
                  notification.seen
                    ? 'bg-gray-100'
                    : 'bg-white border border-gray-300'
                }`}
              >
                <p className="font-medium text-base sm:text-lg text-black">
                  {notification.message}
                </p>
                {/* Commented out timestamp display */}
                {/* <p className="text-xs sm:text-sm text-gray-500">
                  {formatDateTime(notification.timestamp)}
                </p> */}
                {!notification.seen && (
                  <button
                    className="mt-3 text-blue-500 text-sm hover:text-blue-600 underline"
                    onClick={() => markAsSeen(notification.id)}
                  >
                    Mark as Seen
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
