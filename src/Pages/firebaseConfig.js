// firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCYdeigPuvdKyVj0rG53IoUZHaVyawyVZY",

  authDomain: "genzconnect-f5082.firebaseapp.com",

  databaseURL: "https://genzconnect-f5082-default-rtdb.firebaseio.com",

  projectId: "genzconnect-f5082",

  storageBucket: "genzconnect-f5082.appspot.com",

  messagingSenderId: "761396074376",

  appId: "1:761396074376:web:ce2c9a3560a78194698c3d",

  measurementId: "G-ZFNR03PDPM"


};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Firebase Auth and Google Auth Provider
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export { auth, provider, signInWithPopup };
