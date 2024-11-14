import React, { useState } from "react";
import { auth, db, storage } from "./firebaseConfig";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { setDoc, doc, getDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useNavigate } from "react-router-dom";
import "tailwindcss/tailwind.css";
import logo from "../assets/logo.svg";

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
  });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAvatarChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, avatar: e.target.files[0] });
    }
  };

  const handleSignUp = async () => {
    setLoading(true);
    setError("");
    try {
      if (parseInt(formData.age) < 18) {
        setError("You must be 18 or older to sign up.");
        setLoading(false);
        return;
      }

      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);

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
        createdAt: serverTimestamp(),
      });

      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("user", JSON.stringify({
        ...formData,
        avatar: avatarUrl,
      }));
      navigate("/");

    } catch (error) {
      console.error("Error during sign up:", error);
      setError("Sign-up failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
      const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));

      if (userDoc.exists()) {
        const userData = userDoc.data();
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
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-r from-white via-blue-50 to-blue-200 text-gray-900">
        {/* Top Logo and Name (Always at the top on all views) */}
        {/* <div className="flex justify-start items-center p-4 space-x-4 mt-4">
          <img src={logo} alt="Logo" className="h-12 w-12 rounded-full" />
          <div>
            <h1 className="text-4xl font-extrabold text-black">Hii</h1>
            <h1 className="text-4xl font-extrabold text-blue-600">Hive</h1>
          </div>
        </div> */}
  
        {/* Main Content Section */}
        <div className="flex-grow flex flex-col md:flex-row p-8 space-y-6 md:space-y-0 md:space-x-12">
          {/* Login/Sign-Up Form */}
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
                      onChange={handleChange}
                      className="w-full p-3 rounded-lg bg-gray-100 border focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />
                    <input
                      type="text"
                      name="username"
                      placeholder="Username"
                      value={formData.username}
                      onChange={handleChange}
                      className="w-full p-3 rounded-lg bg-gray-100 border focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />
                    <input
                      type="number"
                      name="age"
                      placeholder="Age"
                      value={formData.age}
                      onChange={handleChange}
                      className="w-full p-3 rounded-lg bg-gray-100 border focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />
                  </>
                )}
  
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full p-3 rounded-lg bg-gray-100 border focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full p-3 rounded-lg bg-gray-100 border focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
  
                {isSignUp && (
                  <>
                    <textarea
                      name="bio"
                      placeholder="Bio"
                      value={formData.bio}
                      onChange={handleChange}
                      className="w-full p-3 rounded-lg bg-gray-100 border focus:outline-none focus:ring-2 focus:ring-blue-300"
                      rows="3"
                    />
                    <div>
                      <label className="text-gray-700">Select Avatar</label>
                      <input
                        type="file"
                        onChange={handleAvatarChange}
                        className="w-full p-3 rounded-lg bg-gray-100 border focus:outline-none focus:ring-2 focus:ring-blue-300"
                      />
                    </div>
                  </>
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
  
          {/* Right Section: App Description */}
          <div className="w-full md:w-3/5 flex flex-col justify-center items-start p-8 space-y-8">
            {/* App Description Content */}
            <h2 className="text-3xl font-semibold text-gray-900">What is HiiHive?</h2>
            <p className="text-lg text-gray-600">
              HiiHive is your all-in-one community platform for learning, connecting, and growing together. Stay updated, join dynamic communities, and explore knowledge-rich content in an elegant, seamless environment.
            </p>
  
            {/* Features / Benefits */}
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
                <p className="mt-2 text-lg font-medium text-gray-900">Knowledge Hub</p>
              </div>
              <div className="flex flex-col items-center space-y-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12 text-yellow-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
                <p className="mt-2 text-lg font-medium text-gray-900">Explore</p>
              </div>
            </div>
          </div>
        </div>
  
        {/* Footer Section */}
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
  
