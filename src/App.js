import React, { useState, useEffect, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { auth } from './Pages/firebaseConfig';
import Loading from './components/Loading';

const HomePage = React.lazy(() => import('./Pages/HomePage'));
const LoginPage = React.lazy(() => import('./Pages/Login'));
const Header = React.lazy(() => import('./components/Header'));
const Explore = React.lazy(() => import('./Pages/UserList'));
const ChatInterface = React.lazy(() => import('./Pages/ChatInterface'));
const ChatList = React.lazy(() => import('./Pages/ChatList'));
const UploadPost = React.lazy(() => import('./Pages/UploadPost'));
const UserProfile = React.lazy(() => import('./Pages/UserProfile'));
const Settings = React.lazy(() => import('./Pages/SettingPage'));

function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [appLoading, setAppLoading] = useState(true);

  // Track authentication state
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setAuthLoading(false); // Set auth loading to false once auth state is determined
    });
    return () => unsubscribe();
  }, []);

  // Delay hiding the loading screen for at least 5 seconds after authentication check is done
  useEffect(() => {
    if (!authLoading) {
      const loadingDelay = setTimeout(() => {
        setAppLoading(false); // Final app loading complete after 5 seconds
      }, 5000); // Delay of 5 seconds (adjust to 8000 for 8 seconds if desired)

      return () => clearTimeout(loadingDelay); // Cleanup timeout on unmount
    }
  }, [authLoading]);

  // Show loading screen if authentication or app loading is still in progress
  if (authLoading || appLoading) {
    return <Loading />;
  }

  return (
    <Suspense fallback={<Loading />}>
      <Router>
        <Header user={user} />
        <Routes>
          <Route
            path="/login"
            element={user ? <Navigate to="/" /> : <LoginPage />}
          />
          <Route
            path="/"
            element={user ? <HomePage /> : <Navigate to="/login" />}
          />
          <Route
            path="/chat/:chatRoomId"
            element={user ? <ChatInterface currentUser={user} /> : <Navigate to="/login" />}
          />
          <Route
            path="/explore"
            element={user ? <Explore /> : <Navigate to="/login" />}
          />
          <Route
            path="/settings"
            element={user ? <Settings /> : <Navigate to="/login" />}
          />
          <Route
            path="/user/:userId"
            element={user ? <UserProfile /> : <Navigate to="/login" />}
          />
          <Route
            path="/chatlist"
            element={user ? <ChatList currentUser={user} /> : <Navigate to="/login" />}
          />
          <Route
            path="/upload"
            element={user ? <UploadPost currentUser={user} /> : <Navigate to="/login" />}
          />
        </Routes>
      </Router>
    </Suspense>
  );
}

export default App;
