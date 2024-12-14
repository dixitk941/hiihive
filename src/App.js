import React, { useState, useEffect, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { auth } from "./Pages/firebaseConfig";
import Loading from "./components/Loading";
import KnowledgeHub from "./components/KnowledgeHub/KnowledgeHub";

// Lazy loading components
const HomePage = React.lazy(() => import("./Pages/HomePage"));
const HiveePage = React.lazy(() => import("./components/Hivee"));
const LoginPage = React.lazy(() => import("./Pages/Login"));
const Header = React.lazy(() => import("./components/Header"));
const Explore = React.lazy(() => import("./Pages/UserList"));
const ChatInterface = React.lazy(() => import("./Pages/ChatInterface"));
const ChatList = React.lazy(() => import("./Pages/ChatList"));
const UploadPost = React.lazy(() => import("./Pages/UploadPost"));
const UserProfile = React.lazy(() => import("./Pages/UserProfile"));
const Settings = React.lazy(() => import("./Pages/SettingPage"));
const Notification = React.lazy(() => import("./components/Notifications"));
const Stories = React.lazy(() => import("./components/Stories"));

function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [appLoading, setAppLoading] = useState(true);

  // Track authentication state
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user && user.emailVerified) {
        setUser(user);
      } else {
        setUser(null);
      }
      setAuthLoading(false); // Set auth loading to false once auth state is determined
    });
    return () => unsubscribe();
  }, []);

  // Delay hiding the loading screen for at least 2 seconds after authentication check is done
  useEffect(() => {
    if (!authLoading) {
      const loadingDelay = setTimeout(() => {
        setAppLoading(false); // Final app loading complete after 2 seconds
      }, 2000);

      return () => clearTimeout(loadingDelay); // Cleanup timeout on unmount
    }
  }, [authLoading]);

  // Request camera and microphone permissions
  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        console.log('Camera and microphone permissions granted');
        // Do something with the stream
      })
      .catch((error) => {
        console.error('Error accessing camera or microphone:', error);
      });

    // Check if Notification API is available
    if (typeof Notification !== 'undefined' && typeof Notification.requestPermission === 'function') {
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          console.log('Notification permissions granted');
        } else {
          console.log('Notification permissions denied');
        }
      });
    } else {
      console.log('Notification API not supported');
    }
  }, []);

  // Show loading screen if authentication or app loading is still in progress
  if (authLoading || appLoading) {
    return <Loading />;
  }

  return (
    <Router>
      <ConditionalHeader user={user} />
      <Routes>
        {/* Lazy-loaded routes */}
        <Route
          path="/login"
          element={user ? <Navigate to="/" /> : <Suspense fallback={<Loading />}><LoginPage /></Suspense>}
        />
        <Route
          path="/"
          element={user ? <Suspense fallback={<Loading />}><HomePage /></Suspense> : <Navigate to="/login" />}
        />
        <Route
          path="/hivee"
          element={user ? <Suspense fallback={<Loading />}><HiveePage /></Suspense> : <Navigate to="/login" />}
        />
        <Route
          path="/chat/:chatRoomId"
          element={user ? <Suspense fallback={<Loading />}><ChatInterface currentUser={user} /></Suspense> : <Navigate to="/login" />}
        />
        <Route
          path="/explore"
          element={user ? <Suspense fallback={<Loading />}><Explore /></Suspense> : <Navigate to="/login" />}
        />
        <Route
          path="/settings"
          element={user ? <Suspense fallback={<Loading />}><Settings /></Suspense> : <Navigate to="/login" />}
        />
        <Route
          path="/user/:userId"
          element={user ? <Suspense fallback={<Loading />}><UserProfile /></Suspense> : <Navigate to="/login" />}
        />
        <Route
          path="/chatlist"
          element={user ? <Suspense fallback={<Loading />}><ChatList currentUser={user} /></Suspense> : <Navigate to="/login" />}
        />
        <Route
          path="/upload"
          element={user ? <Suspense fallback={<Loading />}><UploadPost currentUser={user} /></Suspense> : <Navigate to="/login" />}
        />
        <Route
          path="/notifications"
          element={user ? <Suspense fallback={<Loading />}><Notification currentUser={user} /></Suspense> : <Navigate to="/login" />}
        />
        <Route
          path="/stories"
          element={user ? <Suspense fallback={<Loading />}><Stories currentUser={user} /></Suspense> : <Navigate to="/login" />}
        />
        <Route
          path="/knowledgehub"
          element={user ? <Suspense fallback={<Loading />}><KnowledgeHub /></Suspense> : <Navigate to="/login" />}
        />
      </Routes>
    </Router>
  );
}

const ConditionalHeader = ({ user }) => {
  const location = useLocation();

  // Paths where the header should be hidden
  const hideHeaderPaths = ["/chat/:chatRoomId", "/hivee"];

  // Check if the current path matches any of the hideHeaderPaths
  const shouldHideHeader = hideHeaderPaths.some((path) => {
    if (path.includes(":")) {
      const basePath = path.split("/:")[0];
      return location.pathname.startsWith(basePath);
    }
    return location.pathname === path;
  });

  return !shouldHideHeader && <Header user={user} />;
};

export default App;
