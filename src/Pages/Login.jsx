import React, { useState } from "react";
import { auth, provider, signInWithPopup } from "./firebaseConfig";
import { useNavigate } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";
import "tailwindcss/tailwind.css";
import logo from "../assets/logo.svg"; // Import your logo

const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      setUser({
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
      });
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("user", JSON.stringify(user));
      navigate("/"); // Redirect after login
    } catch (error) {
      console.error("Error during login:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-r from-white via-blue-50 to-blue-200 text-gray-900">
      {/* Top Logo and Name (Always at the top on all views) */}
      <div className="flex justify-start items-center p-4 space-x-4 mt-4">
        <img src={logo} alt="Logo" className="h-12 w-12 rounded-full" />
        <div>
          <h1 className="text-4xl font-extrabold text-black">Hii</h1>
          <h1 className="text-4xl font-extrabold text-blue-600">Hive</h1>
        </div>
      </div>

      {/* Main Content: Login & Info (Flexible Layout) */}
      <div className="flex-grow flex flex-col md:flex-row p-8 space-y-6 md:space-y-0 md:space-x-12">
        {/* Left Section: Login Form */}
        <div className="w-full md:w-2/5 flex justify-center items-center md:mr-12 p-8">
          <div className="w-full max-w-md p-8 rounded-xl bg-white shadow-lg space-y-6 relative z-10">
            {/* Login Card Content */}
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-6">
              Welcome to HiiHive
            </h2>
            <p className="text-lg text-center text-gray-600 mb-8">
              Sign in to explore your community and knowledge hub.
            </p>

            {/* Google Sign-In Button */}
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold py-3 px-6 rounded-lg shadow-lg w-full hover:bg-blue-800 transition duration-300 ease-in-out flex items-center justify-center space-x-3"
            >
              <FcGoogle className="w-6 h-6" />
              <span className="text-xl">Sign in with Google</span>
              {loading && (
                <svg
                  className="animate-spin h-6 w-6 ml-3 border-t-2 border-b-2 border-white rounded-full"
                  viewBox="0 0 24 24"
                ></svg>
              )}
            </button>

            {/* User Profile Section */}
            {user && (
              <div className="mt-6 text-center">
                <h2 className="text-2xl font-semibold text-gray-900">{`Welcome, ${user.displayName}`}</h2>
                <p className="text-lg text-gray-600">{user.email}</p>
                <img
                  src={user.photoURL}
                  alt={user.displayName}
                  className="w-20 h-20 rounded-full mt-4 border-4 border-blue-500"
                />
              </div>
            )}
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
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 2v20m10-10H2"
                />
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
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 9l-7 7-7-7"
                />
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
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 5l7 7-7 7"
                />
              </svg>
              <p className="mt-2 text-lg font-medium text-gray-900">Explore</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full bg-transparent text-black py-6 mt-8 md:mt-auto">
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
