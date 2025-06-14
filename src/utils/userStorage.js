/**
 * userStorage.js
 * Utility for storing and retrieving user data from localStorage
 * This helps reduce database fetching and improves application performance
 */

// Constants
const USER_STORAGE_KEY = 'hiihive_user';
const USER_EXPIRY_TIME = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * Store user data in localStorage with timestamp
 * @param {Object} userData - The user data to store
 */
export const storeUser = (userData) => {
  if (!userData) return;
  
  try {
    const dataToStore = {
      user: userData,
      timestamp: Date.now(),
      expiryTime: Date.now() + USER_EXPIRY_TIME
    };
    
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(dataToStore));
    console.log('User data stored in localStorage successfully');
  } catch (error) {
    console.error('Error storing user data in localStorage:', error);
  }
};

/**
 * Get user data from localStorage if it exists and hasn't expired
 * @returns {Object|null} User data or null if not found or expired
 */
export const getStoredUser = () => {
  try {
    const storedData = localStorage.getItem(USER_STORAGE_KEY);
    
    if (!storedData) {
      return null;
    }
    
    const parsedData = JSON.parse(storedData);
    
    // Check if the data has expired
    if (Date.now() > parsedData.expiryTime) {
      console.log('Stored user data has expired');
      clearStoredUser();
      return null;
    }
    
    console.log('Retrieved user data from localStorage');
    return parsedData.user;
  } catch (error) {
    console.error('Error retrieving user data from localStorage:', error);
    return null;
  }
};

/**
 * Clear user data from localStorage
 */
export const clearStoredUser = () => {
  try {
    localStorage.removeItem(USER_STORAGE_KEY);
    console.log('User data cleared from localStorage');
  } catch (error) {
    console.error('Error clearing user data from localStorage:', error);
  }
};

/**
 * Update specific fields in the stored user data
 * @param {Object} updates - The fields to update
 * @returns {Object|null} Updated user data or null if update failed
 */
export const updateStoredUser = (updates) => {
  try {
    const storedData = localStorage.getItem(USER_STORAGE_KEY);
    
    if (!storedData) {
      return null;
    }
    
    const parsedData = JSON.parse(storedData);
    
    // Create updated user object
    const updatedUser = {
      ...parsedData.user,
      ...updates
    };
    
    // Store the updated data
    storeUser(updatedUser);
    
    return updatedUser;
  } catch (error) {
    console.error('Error updating stored user data:', error);
    return null;
  }
};

/**
 * Check if user data is stored and valid
 * @returns {boolean} Whether valid user data exists
 */
export const hasValidStoredUser = () => {
  return getStoredUser() !== null;
};

/**
 * Get the age of stored user data in milliseconds
 * @returns {number|null} Age in milliseconds or null if no data
 */
export const getStoredUserAge = () => {
  try {
    const storedData = localStorage.getItem(USER_STORAGE_KEY);
    
    if (!storedData) {
      return null;
    }
    
    const parsedData = JSON.parse(storedData);
    return Date.now() - parsedData.timestamp;
  } catch (error) {
    console.error('Error getting stored user age:', error);
    return null;
  }
};

/**
 * Check if stored user data needs refresh (older than specified time)
 * @param {number} maxAge - Maximum age in milliseconds
 * @returns {boolean} Whether data needs refresh
 */
export const needsRefresh = (maxAge = 3600000) => { // Default: 1 hour
  const age = getStoredUserAge();
  return age === null || age > maxAge;
};

/**
 * Force refresh by clearing the stored user data
 */
export const forceRefresh = () => {
  clearStoredUser();
};

// Create default export object
const userStorage = {
  storeUser,
  getStoredUser,
  clearStoredUser,
  updateStoredUser,
  hasValidStoredUser,
  getStoredUserAge,
  needsRefresh,
  forceRefresh
};

export default userStorage;
