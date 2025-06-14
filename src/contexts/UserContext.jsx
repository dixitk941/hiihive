import React, { createContext, useState, useEffect, useContext } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../components/firebaseConfig';
import userStorage from '../utils/userStorage';

// Create the context
export const UserContext = createContext(null);

// Custom hook to use the user context
export const useUserContext = () => useContext(UserContext);

export const UserProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Fetch user data from Firestore
  const fetchUserFromFirestore = async (authUser) => {
    try {
      setError(null);
      const userRef = doc(db, 'users', authUser.uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = {
          uid: authUser.uid,
          email: authUser.email,
          displayName: authUser.displayName,
          photoURL: authUser.photoURL,
          ...userDoc.data(),
          lastFetched: Date.now()
        };
        return userData;
      } else {
        // Fallback if no user document exists yet
        return {
          uid: authUser.uid,
          email: authUser.email,
          displayName: authUser.displayName || '',
          photoURL: authUser.photoURL,
          username: authUser.email?.split('@')[0] || '',
          lastFetched: Date.now()
        };
      }
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError(err.message);
      // Return basic user info on error
      return {
        uid: authUser.uid,
        email: authUser.email,
        displayName: authUser.displayName || '',
        photoURL: authUser.photoURL,
        lastFetched: Date.now()
      };
    }
  };

  // Update user in state and storage
  const updateUser = (updates) => {
    setCurrentUser(prev => {
      if (!prev) return null;
      
      const updated = { ...prev, ...updates };
      userStorage.storeUser(updated);
      return updated;
    });
  };

  // Force refresh user data from database
  const refreshUserData = async () => {
    const auth = getAuth();
    if (auth.currentUser) {
      setLoading(true);
      userStorage.forceRefresh();
      const userData = await fetchUserFromFirestore(auth.currentUser);
      userStorage.storeUser(userData);
      setCurrentUser(userData);
      setLoading(false);
    }
  };

  // Handle auth state changes
  useEffect(() => {
    const auth = getAuth();
    
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        // Check if we have cached user data
        const storedUser = userStorage.getStoredUser();
        
        // If we have valid stored data for the same user, use it immediately
        if (storedUser && storedUser.uid === authUser.uid) {
          setCurrentUser(storedUser);
          setLoading(false);
          
          // Check if we need to refresh in the background
          if (userStorage.needsRefresh()) {
            console.log('Refreshing user data in background');
            try {
              const freshData = await fetchUserFromFirestore(authUser);
              userStorage.storeUser(freshData);
              setCurrentUser(freshData);
            } catch (err) {
              console.error('Background refresh failed:', err);
            }
          }
        } else {
          // No valid stored data, fetch from Firestore
          try {
            const userData = await fetchUserFromFirestore(authUser);
            userStorage.storeUser(userData);
            setCurrentUser(userData);
          } catch (err) {
            console.error('Error in user data fetch:', err);
          } finally {
            setLoading(false);
          }
        }
      } else {
        // User is signed out
        setCurrentUser(null);
        userStorage.clearStoredUser();
        setLoading(false);
      }
    });
    
    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  const value = {
    currentUser,
    loading,
    error,
    updateUser,
    refreshUserData,
    isAuthenticated: !!currentUser
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

export default UserProvider;
