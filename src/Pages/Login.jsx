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
    college: "" // Add college field
  });
  const [error, setError] = useState("");
  const [isDesktop, setIsDesktop] = useState(window.innerWidth > 768);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const navigate = useNavigate();

  const prohibitedWords = [
    "sex", "sexual", "explicit", "violence", "hate", "abuse", 
    "racism", "offensive", "bullying", "terrorism", "murder", "drugs",
    "illegal", "torture", "pedophilia", "slut", "bitch", "asshole",
    "nigger", "faggot", "cunt", "motherfucker", "cock", "dick", 
    "whore", "rape", "incest", "pussy", "porn", "prostitution",
    // Hindi offensive words
    "गंदी", "रंडी", "कुत्ता", "चूत", "लौंडा", "लुंगी", "मादरचोद", 
    "बहनचोद", "भोसड़ी", "साले", "सुसरा", "चूतिया", "हरामखोर", 
    "गांजा", "शराब", "बलात्कार", "मुत", "पागल", "बेशर्म", "गधें", 
    "साला", "कुत्ते", "गधा", "दुष्कर्म", "महिला तशदद", "लड़की की इज्जत",
    "जघन्य अपराध", "अश्लील", "अश्लीलता"
    // Add more words as needed
  ];
  
  const containsProhibitedWords = () => {
    const inputValues = Object.values(formData);
    for (let value of inputValues) {
      if (typeof value === "string") {
        const words = value.split(/\s+/); // Split by spaces or whitespace
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

      await setDoc(doc(db, "users", userCredential.user.uid), {
        fullName: formData.fullName,
        email: formData.email,
        age: formData.age,
        avatar: avatarUrl,
        username: formData.username,
        bio: formData.bio,
        college: formData.college, // Store college in Firestore
        createdAt: serverTimestamp(),
      });

      await sendEmailVerification(userCredential.user);
      setError(
        "Sign up successful! A verification email has been sent to your email. Please verify your email before logging in."
      );

      await auth.signOut(); // Sign out the user immediately after signup
      setIsSignUp(false); // Switch to login form after sign-up.
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
        await auth.signOut(); // Ensure the user is signed out if email is not verified.
        return;
      }

      const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("user", JSON.stringify(userData));
        navigate("/"); // Redirect to homepage after successful login.
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
    <div className="flex flex-col min-h-screen bg-gradient-to-r from-white via-blue-50 to-blue-200 text-gray-900">
      <div className="flex-grow flex flex-col md:flex-row p-8 space-y-6 md:space-y-0 md:space-x-12">
        <div className="w-full md:w-2/5 flex justify-center items-center p-8">
          <div className="w-full max-w-md p-8 rounded-xl bg-white shadow-lg transition-shadow hover:shadow-2xl space-y-6">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
              {isSignUp ? "Create an Account" : "Welcome Back to HiiHive"}
            </h2>

            {error && <p className="text-red-500 text-center">{error}</p>}

            <form className="space-y-4">
              {isSignUp && (
                <>
                  <input
                    type="text"
                    name="fullName"
                    placeholder="Full Name"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className="w-full p-3 rounded-lg bg-gray-100 border focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                  <input
                    type="text"
                    name="username"
                    placeholder="Username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className="w-full p-3 rounded-lg bg-gray-100 border focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                  <input
                    type="number"
                    name="age"
                    placeholder="Age"
                    value={formData.age}
                    onChange={handleInputChange}
                    className="w-full p-3 rounded-lg bg-gray-100 border focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                  <textarea
                    name="bio"
                    placeholder="Bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    className="w-full p-3 rounded-lg bg-gray-100 border focus:outline-none focus:ring-2 focus:ring-blue-300"
                  ></textarea>
      import ReactAvatar from 'react-avatar';

<div className="relative w-full">
  <label htmlFor="avatar" className="block text-sm font-medium text-gray-700 mb-1">
    Profile Picture
  </label>
  <div className="flex items-center space-x-4">
    {/* Profile Preview */}
    {formData.avatar ? (
      <div className="w-16 h-16 rounded-full overflow-hidden border border-gray-300">
        <img
          src={URL.createObjectURL(formData.avatar)}
          alt="Profile Preview"
          className="w-full h-full object-cover"
        />
      </div>
    ) : (
      <ReactAvatar
        name="User"  // Default name for avatar generation
        size="50"     // Avatar size
        round={true}  // Makes the avatar circular
      />
    )}

    {/* Custom File Input */}
    <label
      htmlFor="avatar"
      className="flex items-center justify-center px-4 py-2 bg-blue-500 text-white rounded-lg cursor-pointer hover:bg-blue-600 focus:outline-none transition-all duration-300"
    >
      Upload Picture
      <input
        type="file"
        name="avatar"
        id="avatar"
        onChange={(e) => handleFileChange(e)}
        className="hidden"
      />
    </label>
  </div>
</div>

                  <select
                    name="college"
                    value={formData.college}
                    onChange={handleInputChange}
                    className="w-full p-3 rounded-lg bg-gray-100 border focus:outline-none focus:ring-2 focus:ring-blue-300"
                  >
                    <option value="">Select College</option>
                    {colleges.map((college, index) => (
                      <option key={index} value={college}>
                        {college}
                      </option>
                    ))}
                  </select>
                </>
              )}

              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full p-3 rounded-lg bg-gray-100 border focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
             <div className="relative w-full">
  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
    Password
  </label>
  <div className="relative">
    <input
      type={passwordVisible ? "text" : "password"}
      name="password"
      value={formData.password}
      onChange={handleInputChange}
      className="w-full px-4 py-2 pr-10 text-gray-900 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
      placeholder="Enter your password"
    />
    <button
      type="button"
      onClick={() => setPasswordVisible(!passwordVisible)}
      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-blue-500 focus:outline-none transition-all duration-300"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className={`w-5 h-5 transform transition-transform duration-300 ${
          passwordVisible ? "scale-110 opacity-100" : "scale-100 opacity-70"
        }`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        {passwordVisible ? (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.97 0-9-4.03-9-9 0-1.403.307-2.733.875-3.975m13.05 7.95a9.958 9.958 0 001.95-4.975c0-4.97-4.03-9-9-9a9.962 9.962 0 00-4.975 1.95M9.88 9.88a3 3 0 104.24 4.24m-4.24-4.24L5.12 5.12"
          />
        ) : (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M15 12h.01M12 12h.01M9 12h.01M21 12c0-4.418-5.373-8-12-8S-3 7.582-3 12s5.373 8 12 8 12-3.582 12-8zm-9 0a3 3 0 11-6 0 3 3 0 016 0z"
          />
        )}
      </svg>
    </button>
  </div>
</div>

              {isSignUp && (
                <p className="text-sm text-gray-500 mt-2">
                  Password must be at least 8 characters long and include an uppercase letter, a lowercase letter, a number, and a special character.
                </p>
              )}
              <button
                type="button"
                onClick={isSignUp ? handleSignUp : handleLogin}
                disabled={loading}
                className="bg-blue-500 hover:bg-blue-600 text-white w-full py-3 rounded-lg transition-colors"
              >
                {loading
                  ? isSignUp
                    ? "Signing Up..."
                    : "Logging In..."
                  : isSignUp
                  ? "Sign Up"
                  : "Log In"}
              </button>
            </form>

            {!isSignUp && (
              <p className="text-center text-gray-600 mt-4">
                <span
                  className="text-blue-500 cursor-pointer"
                  onClick={handlePasswordReset}
                >
                  Forgot Password?
                </span>
              </p>
            )}

            {/* {isDesktop && (
              <div className="text-center mt-4">
                <a
                  href="https://expo.dev/artifacts/eas/n9249p3RDhDhzurJQkwxYe.apk"
                  className="text-blue-500 cursor-pointer"
                >
                  Download Android App
                </a>
              </div>
            )} */}

            <p className="text-center text-gray-600 mt-4">
              {isSignUp ? (
                <>
                  Already have an account?{" "}
                  <span
                    className="text-blue-500 cursor-pointer"
                    onClick={() => setIsSignUp(false)}
                  >
                    Log In
                  </span>
                </>
              ) : (
                <>
                  Don’t have an account?{" "}
                  <span
                    className="text-blue-500 cursor-pointer"
                    onClick={() => setIsSignUp(true)}
                  >
                    Sign Up
                  </span>
                </>
              )}
            </p>
          </div>
        </div>

        <div className="w-full md:w-3/5 flex flex-col justify-center items-start p-8 space-y-8">
          <h2 className="text-3xl font-semibold text-gray-900">What is HiiHive?</h2>
          <p className="text-lg text-gray-600">
            HiiHive is your all-in-one community platform for learning,
            connecting, and growing together. Stay updated, join dynamic
            communities, and explore knowledge-rich content in an elegant,
            seamless environment.
          </p>

          <div className="flex justify-start space-x-8 mt-8">
            <div className="flex flex-col items-center space-y-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 2v20m10-10H2" />
              </svg>
              <p className="mt-2 text-lg font-medium text-gray-900">Communities</p>
            </div>
            <div className="flex flex-col items-center space-y-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
              <p className="mt-2 text-lg font-medium text-gray-900">KnowledgeHub</p>
            </div>
          </div>
        </div>
      </div>

      <footer className="w-full bg-transparent text-black py-6 mt-8">
        <div className="flex justify-center md:justify-end items-center space-x-6">
          <p className="text-sm text-black">Created by <strong>DixitK941</strong></p>
          <img src={logo} alt="Logo" className="h-12 w-12 rounded-full" />
          <p className="text-sm text-black">Powered by <strong>AINOR</strong></p>
        </div>
      </footer>
    </div>
  );
};

export default LoginPage;
