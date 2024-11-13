import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './Pages/HomePage';
import LoginPage from './Pages/Login';
import Header from "./components/Header";
import { auth } from './Pages/firebaseConfig'; // Import Firebase auth
import Explore from './Pages/UserList';
import ChatInterface from './Pages/ChatInterface'; // Import ChatInterface
import ChatList from "./Pages/ChatList"; // Import ChatList

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Add loading state

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false); // Set loading to false once auth state is determined
    });
    return () => unsubscribe(); // Cleanup listener on unmount
  }, []);

  if (loading) {
    return <p>Loading...</p>; // Show loading indicator while determining auth state
  }

  return (
    <Router>
      <Header user={user} />
      <Routes>
        <Route
          path="/login"
          element={user ? <Navigate to="/" /> : <LoginPage />} // Redirect to homepage if user is logged in
        />
        <Route
          path="/"
          element={user ? <HomePage /> : <Navigate to="/login" />} // Redirect to login if user is not logged in
        />
        <Route
          path="/chat/:chatRoomId"
          element={user ? <ChatInterface currentUser={user} /> : <Navigate to="/login" />} // Redirect to login if user is not logged in
        />
        <Route
          path="/explore"
          element={user ? <Explore /> : <Navigate to="/login" />} // Redirect to login if user is not logged in
        />
        <Route
          path="/chatlist"
          element={user ? <ChatList /> : <Navigate to="/login" />} // Redirect to login if user is not logged in
        />
      </Routes>
    </Router>
  );
}

export default App;