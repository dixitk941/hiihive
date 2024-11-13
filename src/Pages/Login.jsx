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
    setFormData({ ...formData, avatar: e.target.files[0] });
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
      <div className="flex justify-start items-center p-4 space-x-4 mt-4">
        <img src={logo} alt="Logo" className="h-12 w-12 rounded-full" />
        <div>
          <h1 className="text-4xl font-extrabold text-black">Hii</h1>
          <h1 className="text-4xl font-extrabold text-blue-600">Hive</h1>
        </div>
      </div>

      <div className="flex-grow flex flex-col md:flex-row p-8 space-y-6 md:space-y-0 md:space-x-12">
        <div className="w-full md:w-2/5 flex justify-center items-center md:mr-12 p-8">
          <div className="w-full max-w-md p-8 rounded-xl bg-white shadow-lg space-y-6 relative z-10">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-6">
              {isSignUp ? "Create an Account" : "Welcome Back to HiiHive"}
            </h2>

            {error && <p className="text-red-500 text-center">{error}</p>}

            {isSignUp ? (
              <>
                <input type="text" name="fullName" placeholder="Full Name" value={formData.fullName} onChange={handleChange} className="w-full p-4 rounded-xl bg-gray-100 border" />
                <input type="text" name="username" placeholder="Username" value={formData.username} onChange={handleChange} className="w-full p-4 rounded-xl bg-gray-100 border" />
                <input type="number" name="age" placeholder="Age" value={formData.age} onChange={handleChange} className="w-full p-4 rounded-xl bg-gray-100 border" />
                <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} className="w-full p-4 rounded-xl bg-gray-100 border" />
                <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} className="w-full p-4 rounded-xl bg-gray-100 border" />
                <textarea name="bio" placeholder="Bio" value={formData.bio} onChange={handleChange} className="w-full p-4 rounded-xl bg-gray-100 border" rows="3"></textarea>
                <div>
                  <label className="text-gray-700">Select Avatar</label>
                  <input type="file" onChange={handleAvatarChange} className="w-full p-4 rounded-xl bg-gray-100 border" />
                </div>
                <button onClick={handleSignUp} disabled={loading} className="bg-blue-500 text-white w-full py-3 rounded-lg">
                  {loading ? "Signing Up..." : "Sign Up"}
                </button>
                <p className="text-center mt-4 text-gray-600">Already have an account? <span className="text-blue-500 cursor-pointer" onClick={() => setIsSignUp(false)}>Log In</span></p>
              </>
            ) : (
              <>
                <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} className="w-full p-4 rounded-xl bg-gray-100 border" />
                <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} className="w-full p-4 rounded-xl bg-gray-100 border" />
                <button onClick={handleLogin} disabled={loading} className="bg-blue-500 text-white w-full py-3 rounded-lg">
                  {loading ? "Logging In..." : "Log In"}
                </button>
                <p className="text-center mt-4 text-gray-600">Don’t have an account? <span className="text-blue-500 cursor-pointer" onClick={() => setIsSignUp(true)}>Sign Up</span></p>
              </>
            )}
          </div>
        </div>
      </div>

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
