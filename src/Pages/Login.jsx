import React, { useState, useEffect } from "react";
import { auth, db, storage } from "./firebaseConfig";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { setDoc, doc, serverTimestamp, getDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useNavigate } from "react-router-dom";
import "tailwindcss/tailwind.css";
import logo from "../assets/logo.svg";
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";
import ReactAvatar from 'react-avatar';
import { createOrJoinCollegeCommunity, addCommunityToUserProfile } from '../utils/communityManager';
import { useTheme } from '../context/ThemeContext'; // Import the theme context
import SEOHead from '../components/SEOHead';

const colleges = [
  "Rajiv Academy For Technology and Management, Mathura",
  "GLA University, Mathura",
  "GL Bajaj, Mathura"
];

const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
    username: "",
    age: "",
    bio: "",
    avatar: null,
    college: ""
  });
  const [error, setError] = useState("");
  const [isDesktop, setIsDesktop] = useState(window.innerWidth > 768);
  const [passwordVisible, setPasswordVisible] = useState(false);
  // Use theme context instead of local state and system preference
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();

  const prohibitedWords = [
    "sex", "sexual", "explicit", "violence", "hate", "abuse", 
    "racism", "offensive", "bullying", "terrorism", "murder", "drugs",
    "illegal", "torture", "pedophilia", "slut", "bitch", "asshole",
    "nigger", "faggot", "cunt", "motherfucker", "cock", "dick", 
    "whore", "rape", "incest", "pussy", "porn", "prostitution",
    "गंदी", "रंडी", "कुत्ता", "चूत", "लौंडा", "लुंगी", "मादरचोद", 
    "बहनचोद", "भोसड़ी", "साले", "सुसरा", "चूतिया", "हरामखोर", 
    "गांजा", "शराब", "बलात्कार", "मुत", "पागल", "बेशर्म", "गधें", 
    "साला", "कुत्ते", "गधा", "दुष्कर्म", "महिला तशदद", "लड़की की इज्जत",
    "जघन्य अपराध", "अश्लील", "अश्लीलता"
  ];
  
  const containsProhibitedWords = () => {
    const inputValues = Object.values(formData);
    for (let value of inputValues) {
      if (typeof value === "string") {
        const words = value.split(/\s+/);
        for (let word of words) {
          if (prohibitedWords.includes(word.toLowerCase())) {
            return true;
          }
        }
      }
    }
    return false;
  };

  const isValidUsername = (username) => {
    const usernameRegex = /^[a-z0-9_]+$/;
    return usernameRegex.test(username);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, avatar: file });
    }
  };

  const handleSignUp = async () => {
    setLoading(true);
    setError("");

    if (!isValidUsername(formData.username)) {
      setError("Username can only contain lowercase letters, numbers, and underscores.");
      setLoading(false);
      return;
    }

    const db = getFirestore();
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("username", "==", formData.username));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      setError("Username already exists. Please choose a different username.");
      setLoading(false);
      return;
    }

    if (containsProhibitedWords()) {
      setError("Your input contains prohibited words. Please remove them.");
      setLoading(false);
      return;
    }

    if (!formData.email || !formData.password || !formData.username || !formData.fullName || !formData.age || !formData.college) {
      setError("All fields are required.");
      setLoading(false);
      return;
    }

    try {
      if (parseInt(formData.age) < 13) {
        setError("You must be 18 or older to sign up.");
        setLoading(false);
        return;
      }

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      let avatarUrl = "";
      if (formData.avatar) {
        const avatarRef = ref(storage, `avatars/${userCredential.user.uid}`);
        await uploadBytes(avatarRef, formData.avatar);
        avatarUrl = await getDownloadURL(avatarRef);
      }

      // Prepare user data
      const userData = {
        fullName: formData.fullName,
        email: formData.email,
        age: formData.age,
        avatar: avatarUrl,
        username: formData.username,
        bio: formData.bio,
        college: formData.college,
        createdAt: serverTimestamp(),
      };

      // Create user document
      await setDoc(doc(db, "users", userCredential.user.uid), {
        fullName: formData.fullName,
        email: formData.email,
        age: formData.age,
        avatar: avatarUrl,
        username: formData.username,
        bio: formData.bio,
        college: formData.college,
        createdAt: serverTimestamp(),
      });

      // Auto-create/join college community
      if (formData.college) {
        const communityId = await createOrJoinCollegeCommunity(
          userCredential.user.uid, 
          formData.college, 
          {
            username: formData.username,
            fullName: formData.fullName,
            avatar: avatarUrl,
            email: formData.email
          }
        );

        if (communityId) {
          await addCommunityToUserProfile(userCredential.user.uid, communityId);
          console.log(`User automatically joined college community: ${formData.college}`);
        }
      }

      await sendEmailVerification(userCredential.user);
      setError(
        "Sign up successful! A verification email has been sent to your email. Please verify your email before logging in."
      );

      await auth.signOut();
      setIsSignUp(false);
    } catch (error) {
      console.error("Error during sign-up:", error);
      setError("Sign-up failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      if (!userCredential.user.emailVerified) {
        setError(
          "Your email is not verified. Please check your inbox and verify your email before logging in."
        );
        await auth.signOut();
        return;
      }

      const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        // Check if user needs to join their college community
        if (userData.college) {
          const communityId = await createOrJoinCollegeCommunity(
            userCredential.user.uid, 
            userData.college, 
            userData
          );

          if (communityId) {
            await addCommunityToUserProfile(userCredential.user.uid, communityId);
          }
        }

        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("user", JSON.stringify(userData));
        navigate("/");
      } else {
        setError("User data not found.");
      }
    } catch (error) {
      console.error("Error during login:", error);
      setError("Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!formData.email) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await sendPasswordResetEmail(auth, formData.email);
      setError("Password reset email sent! Please check your inbox.");
    } catch (error) {
      console.error("Error during password reset:", error);
      setError("Password reset failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth > 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black transition-colors duration-300">
      <SEOHead 
        title={isSignUp ? "Join HiiHive - Create Your Account" : "Login to HiiHive - Access Your Account"}
        description={isSignUp ? "Create your HiiHive account and join the ultimate college social network. Connect with classmates, share knowledge, and build lasting friendships." : "Login to your HiiHive account and reconnect with your college community. Access your social network and stay connected with classmates."}
        url="https://hiihive.com/login"
        keywords="college login, student account, HiiHive signup, college social network login, student registration"
      />
      {/* Header */}
      <div className="w-full bg-white dark:bg-black border-gray-200 dark:border-gray-900 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img src={logo} alt="HiiHive Logo" className="h-10 w-10 rounded-2xl" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                HiiHive
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className="flex min-h-screen">
        {/* Left Panel - Form */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center px-4 sm:px-6 lg:px-8 py-12">
          <div className="mx-auto w-full max-w-md">
            {/* Welcome Section */}
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {isSignUp ? "Join HiiHive" : "Welcome back"}
              </h2>
              <p className="text-base text-gray-600 dark:text-gray-300">
                {isSignUp 
                  ? "Create your account to get started" 
                  : "Sign in to your account"
                }
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className={`mb-6 p-4 rounded-2xl ${
                error.includes("successful") 
                  ? isDarkMode 
                    ? 'bg-green-900 border border-green-700 text-green-300' 
                    : 'bg-green-50 border border-green-200 text-green-800'
                  : isDarkMode 
                    ? 'bg-red-900 border border-red-700 text-red-300' 
                    : 'bg-red-50 border border-red-200 text-red-800'
              }`}>
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}

            {/* Form Card */}
            <div className={`${isDarkMode ? 'bg-gray-950 border-gray-800' : 'bg-white border-gray-200'} rounded-3xl shadow-lg border p-8`}>
              <form className="space-y-6">
                {isSignUp && (
                  <>
                    {/* Profile Picture Section */}
                    <div className="flex flex-col items-center mb-6">
                      <div className="relative">
                        {formData.avatar ? (
                          <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-blue-500">
                            <img
                              src={URL.createObjectURL(formData.avatar)}
                              alt="Profile Preview"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className={`w-20 h-20 rounded-full border-4 border-dashed ${isDarkMode ? 'border-gray-600' : 'border-gray-300'} flex items-center justify-center`}>
                            <ReactAvatar name="User" size="60" round={true} />
                          </div>
                        )}
                        <label
                          htmlFor="avatar"
                          className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-600 transition-colors"
                        >
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                          </svg>
                          <input
                            type="file"
                            name="avatar"
                            id="avatar"
                            onChange={handleFileChange}
                            className="hidden"
                            accept="image/*"
                          />
                        </label>
                      </div>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mt-2`}>
                        Tap to add photo
                      </p>
                    </div>

                    {/* Name and Username Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'} mb-2`}>
                          Full Name
                        </label>
                        <input
                          type="text"
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-3 rounded-2xl ${isDarkMode ? 'bg-gray-900 text-white border-gray-700' : 'bg-gray-50 text-gray-900 border-gray-200'} border focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                          placeholder="Enter your full name"
                        />
                      </div>
                      <div>
                        <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'} mb-2`}>
                          Username
                        </label>
                        <input
                          type="text"
                          name="username"
                          value={formData.username}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-3 rounded-2xl ${isDarkMode ? 'bg-gray-900 text-white border-gray-700' : 'bg-gray-50 text-gray-900 border-gray-200'} border focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                          placeholder="Choose username"
                        />
                      </div>
                    </div>

                    {/* Age Input */}
                    <div>
                      <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'} mb-2`}>
                        Age
                      </label>
                      <input
                        type="number"
                        name="age"
                        value={formData.age}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 rounded-2xl ${isDarkMode ? 'bg-gray-900 text-white border-gray-700' : 'bg-gray-50 text-gray-900 border-gray-200'} border focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                        placeholder="Enter your age"
                      />
                    </div>

                    {/* College Selection */}
                    <div>
                      <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'} mb-2`}>
                        College
                      </label>
                      <select
                        name="college"
                        value={formData.college}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 rounded-2xl ${isDarkMode ? 'bg-gray-900 text-white border-gray-700' : 'bg-gray-50 text-gray-900 border-gray-200'} border focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                      >
                        <option value="">Select your college</option>
                        {colleges.map((college, index) => (
                          <option key={index} value={college}>
                            {college}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Bio */}
                    <div>
                      <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'} mb-2`}>
                        Bio (Optional)
                      </label>
                      <textarea
                        name="bio"
                        value={formData.bio}
                        onChange={handleInputChange}
                        rows="3"
                        className={`w-full px-4 py-3 rounded-2xl ${isDarkMode ? 'bg-gray-900 text-white border-gray-700' : 'bg-gray-50 text-gray-900 border-gray-200'} border focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none`}
                        placeholder="Tell us about yourself..."
                      />
                    </div>
                  </>
                )}

                {/* Email */}
                <div>
                  <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'} mb-2`}>
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 rounded-2xl ${isDarkMode ? 'bg-gray-900 text-white border-gray-700' : 'bg-gray-50 text-gray-900 border-gray-200'} border focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                    placeholder="Enter your email"
                  />
                </div>

                {/* Password */}
                <div>
                  <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'} mb-2`}>
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={passwordVisible ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 pr-12 rounded-2xl ${isDarkMode ? 'bg-gray-900 text-white border-gray-700' : 'bg-gray-50 text-gray-900 border-gray-200'} border focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setPasswordVisible(!passwordVisible)}
                      className="absolute inset-y-0 right-0 flex items-center pr-4"
                    >
                      <svg
                        className={`w-5 h-5 ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} hover:text-blue-500 transition-colors`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        {passwordVisible ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.97 0-9-4.03-9-9s4.03-9 9-9 9 4.03 9 9a9.958 9.958 0 01-1.95 5.975m-2.55-2.55A3 3 0 0015 12a3 3 0 11-6 0 3 3 0 003-3z" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        )}
                      </svg>
                    </button>
                  </div>
                  {isSignUp && (
                    <p className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} mt-2`}>
                      Must be at least 8 characters with uppercase, lowercase, number and special character.
                    </p>
                  )}
                </div>

                {/* Action Button */}
                <button
                  type="button"
                  onClick={isSignUp ? handleSignUp : handleLogin}
                  disabled={loading}
                  className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-semibold py-4 rounded-2xl transition-colors duration-200 shadow-lg"
                >                  {loading
                    ? (                      <div className="flex items-center justify-center">
                        <div className="relative w-5 h-5 mr-2">
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-5 h-5 border-4 border-white/30 rounded-full"></div>
                          </div>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-5 h-5 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        </div>
                        {isSignUp ? "Creating account..." : "Signing in..."}
                      </div>
                    )
                    : isSignUp
                    ? "Create account"
                    : "Sign in"
                  }
                </button>

                {/* Additional Actions */}
                {!isSignUp && (
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={handlePasswordReset}
                      className={`text-sm ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'} font-medium transition-colors`}
                    >
                      Forgot your password?
                    </button>
                  </div>
                )}

                {/* Toggle Sign Up/Login */}
                <div className="text-center">
                  <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
                    <button
                      type="button"
                      onClick={() => setIsSignUp(!isSignUp)}
                      className={`font-medium ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'} transition-colors`}
                    >
                      {isSignUp ? "Sign in" : "Sign up"}
                    </button>
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Right Panel - Info (Desktop Only) */}
        <div className={`hidden lg:flex lg:w-1/2 ${isDarkMode ? 'bg-black' : 'bg-gradient-to-br from-blue-50 to-blue-100'} relative overflow-hidden`}>
          <div className="flex flex-col justify-center px-12 py-24 relative z-10">
            <div className="max-w-lg">
              <h3 className={`text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-6`}>
                Connect, Learn, Grow
              </h3>
              <p className={`text-lg ${isDarkMode ? 'text-gray-200' : 'text-gray-700'} mb-8 leading-relaxed`}>
                Join thousands of students in building meaningful connections, sharing knowledge, and growing together in our vibrant college community.
              </p>
              
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Join Communities
                    </h4>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      Connect with like-minded peers
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-green-500 rounded-2xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <div>
                    <h4 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Share Knowledge
                    </h4>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      Learn and teach together
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-purple-500 rounded-2xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Stay Updated
                    </h4>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      Never miss important updates
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-1/4 right-1/4 w-72 h-72 bg-blue-500 rounded-full blur-3xl"></div>
            <div className="absolute bottom-1/4 left-1/4 w-72 h-72 bg-purple-500 rounded-full blur-3xl"></div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className={`${isDarkMode ? 'bg-black border-gray-900' : 'bg-white border-gray-200'} border-t`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-center space-x-6">
            <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Created by <span className="font-semibold">DixitK941</span>
            </p>
            <div className={`w-px h-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
            <div className="flex items-center space-x-2">
              <img src={logo} alt="Logo" className="h-6 w-6 rounded-lg" />
              <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Powered by <span className="font-semibold">AINOR</span>
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LoginPage;