import React, { useState } from "react";
import { auth, db, storage } from "./firebaseConfig";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { setDoc, doc, getDoc } from "firebase/firestore";
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
    avatar: null,
  });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAvatarChange = (e) => {
    setFormData({ ...formData, avatar: e.target.files[0] });
  };

  const checkUsernameAvailability = async (username) => {
    const userDoc = await getDoc(doc(db, "users", username));
    return !userDoc.exists();
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

      const isAvailable = await checkUsernameAvailability(formData.username);
      if (!isAvailable) {
        setError("Username already taken.");
        setLoading(false);
        return;
      }

      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);

      // Upload avatar to Firebase Storage and get the URL
      let avatarUrl = "";
      if (formData.avatar) {
        const avatarRef = ref(storage, `avatars/${userCredential.user.uid}`);
        await uploadBytes(avatarRef, formData.avatar);
        avatarUrl = await getDownloadURL(avatarRef);
      }

      // Save user data in Firestore
      await setDoc(doc(db, "users", userCredential.user.uid), {
        fullName: formData.fullName,
        email: formData.email,
        age: formData.age,
        avatar: avatarUrl,
        username: formData.username,
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
        console.log("User Data:", userData);
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
      <div className="flex justify-start items-center p-4 space-x-4 mt-4">
        <img src={logo} alt="Logo" className="h-12 w-12 rounded-full" />
        <div>
          <h1 className="text-4xl font-extrabold text-black">Hii</h1>
          <h1 className="text-4xl font-extrabold text-blue-600">Hive</h1>
        </div>
      </div>

      <div className="flex-grow flex flex-col md:flex-row p-8 space-y-6 md:space-y-0 md:space-x-12">
        {/* Left Section: Login / Sign Up Form */}
        <div className="w-full md:w-2/5 flex justify-center items-center md:mr-12 p-8">
  <div className="w-full max-w-md p-8 rounded-2xl bg-white shadow-2xl space-y-8 relative z-10">
    <h2 className="text-4xl font-extrabold text-center text-gray-900 mb-6">
      {isSignUp ? "Create an Account" : "Welcome Back to HiiHive"}
    </h2>
    <p className="text-lg text-center text-gray-600 mb-8">
      {isSignUp ? "Join our community and grow together!" : "Sign in to continue your journey."}
    </p>

    {error && <p className="text-red-500 text-center">{error}</p>}

    {isSignUp ? (
      <>
        <input
          type="text"
          name="fullName"
          placeholder="Full Name"
          value={formData.fullName}
          onChange={handleChange}
          className="w-full p-4 rounded-xl bg-gray-100 border border-gray-300 focus:ring-2 focus:ring-blue-500 text-gray-800 placeholder-gray-400 shadow-md transition duration-300"
        />
        <input
          type="text"
          name="username"
          placeholder="Username"
          value={formData.username}
          onChange={handleChange}
          className="w-full p-4 rounded-xl bg-gray-100 border border-gray-300 focus:ring-2 focus:ring-blue-500 text-gray-800 placeholder-gray-400 shadow-md transition duration-300"
        />
        <input
          type="number"
          name="age"
          placeholder="Age"
          value={formData.age}
          onChange={handleChange}
          className="w-full p-4 rounded-xl bg-gray-100 border border-gray-300 focus:ring-2 focus:ring-blue-500 text-gray-800 placeholder-gray-400 shadow-md transition duration-300"
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          className="w-full p-4 rounded-xl bg-gray-100 border border-gray-300 focus:ring-2 focus:ring-blue-500 text-gray-800 placeholder-gray-400 shadow-md transition duration-300"
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          className="w-full p-4 rounded-xl bg-gray-100 border border-gray-300 focus:ring-2 focus:ring-blue-500 text-gray-800 placeholder-gray-400 shadow-md transition duration-300"
        />

        <div>
          <label className="text-gray-700 text-lg">Select Avatar</label>
          <input
            type="file"
            onChange={handleAvatarChange}
            className="w-full mt-2 rounded-xl bg-gray-100 border border-gray-300 text-gray-800 shadow-md file:bg-blue-500 file:rounded-xl file:text-white file:px-6 file:py-2 file:cursor-pointer transition duration-300"
          />
        </div>

        <button
          onClick={handleSignUp}
          disabled={loading}
          className="w-full p-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition duration-300 mt-6"
        >
          {loading ? "Signing Up..." : "Sign Up"}
        </button>
      </>
    ) : (
      <>
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          className="w-full p-4 rounded-xl bg-gray-100 border border-gray-300 focus:ring-2 focus:ring-blue-500 text-gray-800 placeholder-gray-400 shadow-md transition duration-300"
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          className="w-full p-4 rounded-xl bg-gray-100 border border-gray-300 focus:ring-2 focus:ring-blue-500 text-gray-800 placeholder-gray-400 shadow-md transition duration-300"
        />
        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full p-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition duration-300 mt-6"
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </>
    )}

    <p className="text-center text-gray-600 mt-4">
      {isSignUp ? (
        <>
          Already have an account?{" "}
          <span
            onClick={() => setIsSignUp(false)}
            className="text-blue-600 cursor-pointer hover:text-blue-700"
          >
            Login
          </span>
        </>
      ) : (
        <>
          Don't have an account?{" "}
          <span
            onClick={() => setIsSignUp(true)}
            className="text-blue-600 cursor-pointer hover:text-blue-700"
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
                  d="M12 2v20m10-10H2"
                />
              </svg>
              <p className="mt-2 text-lg font-medium text-gray-900">Knowledge Sharing</p>
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
