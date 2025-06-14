/**
 * useUser Hook
 * Custom React hook for managing user state with localStorage caching
 * Provides optimized user data fetching and caching across the application
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../components/firebaseConfig';
import { UserStorageManager } from '../utils/userStorage';

export const useUser = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const authUnsubscribeRef = useRef(null);

  /**
   * Fetch user data from Firestore
   * @param {Object} authUser - Firebase Auth user object
   * @returns {Object} User data
   */
  const fetchUserFromFirestore = useCallback(async (authUser) => {
    try {
      const userRef = doc(db, 'users', authUser.uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        return {
          id: authUser.uid,
          uid: authUser.uid,
          email: authUser.email,
          displayName: authUser.displayName,
          photoURL: authUser.photoURL,
          ...userData,
          lastFetched: Date.now()
        };
      } else {
        // Fallback to Firebase Auth data if no Firestore document
        return {
          id: authUser.uid,
          uid: authUser.uid,
          email: authUser.email,
          displayName: authUser.displayName || 'User',
          photoURL: authUser.photoURL,
          fullName: authUser.displayName || 'User',
          username: authUser.email?.split('@')[0] || 'username',
          avatar: authUser.photoURL || null,
          lastFetched: Date.now()
        };
      }
    } catch (error) {
      console.error('Error fetching user data from Firestore:', error);
      // Fallback on error
      return {
        id: authUser.uid,
        uid: authUser.uid,
        email: authUser.email,
        displayName: authUser.displayName || 'User',
        photoURL: authUser.photoURL,
        fullName: authUser.displayName || 'User',
        username: authUser.email?.split('@')[0] || 'username',
        avatar: authUser.photoURL || null,
        lastFetched: Date.now(),
        fromFallback: true
      };
    }
  }, []);

  /**
   * Load user data with caching strategy
   * @param {Object} authUser - Firebase Auth user object
   */
  const loadUserData = useCallback(async (authUser) => {
    try {
      setError(null);
      
      // First, try to get user from localStorage
      const cachedUser = UserStorageManager.getUser();
      
      if (cachedUser && cachedUser.uid === authUser.uid) {
        console.log('Using cached user data');
        setCurrentUser(cachedUser);
        setLoading(false);
        
        // Optionally fetch fresh data in background if cache is old (> 1 hour)
        const cacheAge = UserStorageManager.getUserDataAge();
        if (cacheAge && cacheAge > 60 * 60 * 1000) { // 1 hour
          console.log('Cache is old, refreshing in background');
          try {
            const freshUser = await fetchUserFromFirestore(authUser);
            UserStorageManager.saveUser(freshUser);
            setCurrentUser(freshUser);
          } catch (bgError) {
            console.warn('Background refresh failed:', bgError);
          }
        }
        return;
      }

      // No cache or different user, fetch from Firestore
      console.log('Fetching user data from Firestore');
      const userData = await fetchUserFromFirestore(authUser);
      
      // Save to cache
      UserStorageManager.saveUser(userData);
      setCurrentUser(userData);
      setLoading(false);
      
    } catch (error) {
      console.error('Error loading user data:', error);
      setError(error);
      setLoading(false);
    }
  }, [fetchUserFromFirestore]);

  /**
   * Update user data both in state and localStorage
   * @param {Object} updates - Fields to update
   */
  const updateUser = useCallback((updates) => {
    setCurrentUser(prevUser => {
      if (!prevUser) return null;
      
      const updatedUser = { ...prevUser, ...updates, lastUpdated: Date.now() };
      UserStorageManager.saveUser(updatedUser);
      return updatedUser;
    });
  }, []);

  /**
   * Refresh user data from Firestore
   */
  const refreshUser = useCallback(async () => {
    const auth = getAuth();
    const authUser = auth.currentUser;
    
    if (authUser) {
      setLoading(true);
      UserStorageManager.forceRefresh();
      await loadUserData(authUser);
    }
  }, [loadUserData]);

  /**
   * Clear user data and sign out
   */
  const clearUser = useCallback(() => {
    setCurrentUser(null);
    UserStorageManager.clearUser();
    setLoading(false);
    setError(null);
  }, []);

  // Set up Firebase Auth listener
  useEffect(() => {
    const auth = getAuth();
    
    authUnsubscribeRef.current = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        await loadUserData(authUser);
      } else {
        clearUser();
      }
    });

    return () => {
      if (authUnsubscribeRef.current) {
        authUnsubscribeRef.current();
      }
    };
  }, [loadUserData, clearUser]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (authUnsubscribeRef.current) {
        authUnsubscribeRef.current();
      }
    };
  }, []);

  return {
    currentUser,
    loading,
    error,
    updateUser,
    refreshUser,
    clearUser,
    // Utility functions
    isAuthenticated: !!currentUser,
    cacheInfo: UserStorageManager.getCacheInfo()
  };
};

export default useUser;
