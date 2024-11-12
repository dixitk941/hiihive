import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './Pages/HomePage';
import LoginPage from './Pages/Login';
import Header from "./components/Header";
import { auth } from './Pages/firebaseConfig'; // Import Firebase auth

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(setUser);  // Listen to auth state changes
    return () => unsubscribe(); // Cleanup listener on unmount
  }, []);

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={user ? <Navigate to="/" /> : <LoginPage />} // Redirect to homepage if user is logged in
        />
        <Route
          path="/"
          element={
            user ? (
              <>
                <Header user={user} /> {/* Pass user state to Header */}
                <HomePage /> {/* Your homepage content */}
              </>
            ) : (
              <Navigate to="/login" /> // Redirect to login if not logged in
            )
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
