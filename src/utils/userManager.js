/**
 * userManager.js
 * 
 * A utility for centralized user data management across the application.
 * Provides methods to access and manipulate user data while ensuring 
 * local storage caching for improved performance.
 */

import { getAuth } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../components/firebaseConfig';
import userStorage from './userStorage';

/**
 * Get current user data with storage caching
 * @param {boolean} forceRefresh - Whether to force a refresh from the database
 * @returns {Promise<Object|null>} User data or null if not authenticated
 */
export const getCurrentUser = async (forceRefresh = false) => {
  const auth = getAuth();
  const authUser = auth.currentUser;
  
  if (!authUser) return null;
  
  // If not forcing refresh, try to get from storage first
  if (!forceRefresh) {
    const storedUser = userStorage.getStoredUser();
    if (storedUser && storedUser.uid === authUser.uid && !userStorage.needsRefresh()) {
      console.log('Using cached user data');
      return storedUser;
    }
  }
  
  // Fetch from database
  try {
    console.log('Fetching user data from database');
    const userRef = doc(db, 'users', authUser.uid);
    const docSnap = await getDoc(userRef);
    
    if (docSnap.exists()) {
      const userData = {
        uid: authUser.uid,
        email: authUser.email,
        displayName: authUser.displayName,
        photoURL: authUser.photoURL,
        ...docSnap.data(),
        lastFetched: Date.now()
      };
      
      // Save to storage
      userStorage.storeUser(userData);
      return userData;
    } else {
      // Basic user data if no document exists
      const basicUserData = {
        uid: authUser.uid,
        email: authUser.email,
        displayName: authUser.displayName || '',
        photoURL: authUser.photoURL,
        lastFetched: Date.now()
      };
      
      userStorage.storeUser(basicUserData);
      return basicUserData;
    }
  } catch (error) {
    console.error('Error fetching user data:', error);
    
    // On error, return cached data if available
    const storedUser = userStorage.getStoredUser();
    if (storedUser && storedUser.uid === authUser.uid) {
      console.log('Error fetching from database, using cached data');
      return storedUser;
    }
    
    return null;
  }
};

/**
 * Update user data in database and storage
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object|null>} Updated user data or null on error
 */
export const updateUserData = async (updates) => {
  const auth = getAuth();
  const user = auth.currentUser;
  
  if (!user) return null;
  
  try {
    // Update in database
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, updates);
    
    // Get stored user and update
    const storedUser = userStorage.getStoredUser();
    const updatedUser = storedUser ? { ...storedUser, ...updates } : { ...updates, uid: user.uid };
    
    // Update in storage
    userStorage.storeUser(updatedUser);
    
    return updatedUser;
  } catch (error) {
    console.error('Error updating user data:', error);
    return null;
  }
};

/**
 * Clear user data from storage
 */
export const clearUserData = () => {
  userStorage.clearStoredUser();
};

// Create default export object
const userManager = {
  getCurrentUser,
  updateUserData,
  clearUserData
};

export default userManager;
