// firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyB--KSDIQ_rkc1myOfFBgNjUka30VAKOtM",

  authDomain: "fragveda.firebaseapp.com",

  projectId: "fragveda",

  storageBucket: "fragveda.appspot.com",

  messagingSenderId: "709002213779",

  appId: "1:709002213779:web:314ffb4f33c4b117cd5066"



};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Firebase Auth and Google Auth Provider
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export { auth, provider, signInWithPopup };
