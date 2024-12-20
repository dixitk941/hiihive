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

  // Show loading screen if authentication is still in progress
  if (authLoading) {
    return <Loading />;
  }

  return (
    <Router>
      <ConditionalHeader user={user} />
      <Suspense fallback={<Loading />}>
        <Routes>
          {/* Lazy-loaded routes */}
          <Route
            path="/login"
            element={user ? <Navigate to="/" /> : <LoginPage />}
          />
          <Route
            path="/"
            element={user ? <HomePage /> : <Navigate to="/login" />}
          />
          <Route
            path="/hivee"
            element={user ? <HiveePage /> : <Navigate to="/login" />}
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
          <Route
            path="/notifications"
            element={user ? <Notification currentUser={user} /> : <Navigate to="/login" />}
          />
          <Route
            path="/stories"
            element={user ? <Stories currentUser={user} /> : <Navigate to="/login" />}
          />
          <Route
            path="/knowledgehub"
            element={user ? <KnowledgeHub /> : <Navigate to="/login" />}
          />
        </Routes>
      </Suspense>
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
