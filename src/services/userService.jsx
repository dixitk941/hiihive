// services/userService.js
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebaseConfig'; // Firebase config file
import { getAuth } from 'firebase/auth'; // Firebase Authentication service

export const getCurrentUserData = async () => {
  // Get the currently authenticated user
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) {
    throw new Error('No user is logged in');
  }

  // Fetch user data from Firestore using the authenticated user's UID
  const userRef = doc(db, 'users', user.uid); // Using user.uid to dynamically get the current user's document
  const userDoc = await getDoc(userRef);

  if (userDoc.exists()) {
    return userDoc.data(); // Return the user data
  } else {
    throw new Error('User not found');
  }
};
