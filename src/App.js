import React, { useState, useEffect, Suspense } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { auth } from "./Pages/firebaseConfig";
import { AnimatePresence, motion } from "framer-motion";
import Loading from "./components/Loading";
import KnowledgeHub from "./components/KnowledgeHub/KnowledgeHub";

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

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user && user.emailVerified) {
        setUser(user);
      } else {
        setUser(null);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (authLoading) {
    return <Loading />;
  }

  return (
    <Router>
      <AppContent user={user} />
    </Router>
  );
}

function AppContent({ user }) {
  const location = useLocation();

  return (
    <>
      <ConditionalHeader user={user} location={location} />
      <Suspense fallback={<Loading />}>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route
              path="/login"
              element={user ? <Navigate to="/" /> : <AnimatedPage><LoginPage /></AnimatedPage>}
            />
            <Route
              path="/"
              element={user ? <AnimatedPage><HomePage /></AnimatedPage> : <Navigate to="/login" />}
            />
            <Route
              path="/hivee"
              element={user ? <AnimatedPage><HiveePage /></AnimatedPage> : <Navigate to="/login" />}
            />
            <Route
              path="/chat/:chatRoomId"
              element={
                user ? <AnimatedPage><ChatInterface currentUser={user} /></AnimatedPage> : <Navigate to="/login" />
              }
            />
            <Route
              path="/explore"
              element={user ? <AnimatedPage><Explore /></AnimatedPage> : <Navigate to="/login" />}
            />
            <Route
              path="/settings"
              element={user ? <AnimatedPage><Settings /></AnimatedPage> : <Navigate to="/login" />}
            />
            <Route
              path="/user/:userId"
              element={user ? <AnimatedPage><UserProfile /></AnimatedPage> : <Navigate to="/login" />}
            />
            <Route
              path="/chatlist"
              element={
                user ? <AnimatedPage><ChatList currentUser={user} /></AnimatedPage> : <Navigate to="/login" />
              }
            />
            <Route
              path="/upload"
              element={
                user ? <AnimatedPage><UploadPost currentUser={user} /></AnimatedPage> : <Navigate to="/login" />
              }
            />
            <Route
              path="/notifications"
              element={
                user ? <AnimatedPage><Notification currentUser={user} /></AnimatedPage> : <Navigate to="/login" />
              }
            />
            <Route
              path="/stories"
              element={
                user ? <AnimatedPage><Stories currentUser={user} /></AnimatedPage> : <Navigate to="/login" />
              }
            />
            <Route
              path="/knowledgehub"
              element={user ? <AnimatedPage><KnowledgeHub /></AnimatedPage> : <Navigate to="/login" />}
            />
          </Routes>
        </AnimatePresence>
      </Suspense>
    </>
  );
}

const ConditionalHeader = ({ user, location }) => {
  const hideHeaderPaths = ["/chat/:chatRoomId", "/hivee"];

  const shouldHideHeader = hideHeaderPaths.some((path) => {
    if (path.includes(":")) {
      const basePath = path.split("/:")[0];
      return location.pathname.startsWith(basePath);
    }
    return location.pathname === path;
  });

  return !shouldHideHeader && <Header user={user} />;
};

const AnimatedPage = ({ children }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
    >
      {children}
    </motion.div>
  );
};

export default App;
