// firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";  // Add these imports
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyB--KSDIQ_rkc1myOfFBgNjUka30VAKOtM",
  authDomain: "fragveda.firebaseapp.com",
  projectId: "fragveda",
  storageBucket: "fragveda.appspot.com",
  messagingSenderId: "709002213779",
  appId: "1:709002213779:web:314ffb4f33c4b117cd5066"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export { doc, getDoc };  // Explicitly export these functions
