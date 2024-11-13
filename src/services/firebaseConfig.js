// firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getDatabase } from "firebase/database"; // Import Realtime Database

const firebaseConfig = {
  apiKey: "AIzaSyB--KSDIQ_rkc1myOfFBgNjUka30VAKOtM",
  authDomain: "fragveda.firebaseapp.com",
  projectId: "fragveda",
  storageBucket: "fragveda.appspot.com",
  messagingSenderId: "709002213779",
  appId: "1:709002213779:web:314ffb4f33c4b117cd5066",
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Firestore and Realtime Database
export const auth = getAuth(app);
export const db = getFirestore(app);  // Firestore
export const dbRealtime = getDatabase(app);  // Realtime Database
export const storage = getStorage(app);
