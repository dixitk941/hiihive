import React, { useState, useEffect, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { auth } from "./Pages/firebaseConfig";
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
      }, 5000);

      return () => clearTimeout(loadingDelay); // Cleanup timeout on unmount
    }
  }, [authLoading]);

  // Prevent right-click globally
  useEffect(() => {
    const preventRightClick = (e) => e.preventDefault();
    document.addEventListener("contextmenu", preventRightClick);

    return () => {
      document.removeEventListener("contextmenu", preventRightClick);
    };
  }, []);

  useEffect(() => {
    // Disable zooming
    document.addEventListener(
      "wheel",
      (e) => {
        if (e.ctrlKey) {
          e.preventDefault();
        }
      },
      { passive: false }
    );

    document.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === "+" || e.key === "-" || e.key === "0")) {
        e.preventDefault();
      }
    });

    // Disable opening developer tools
    document.addEventListener("keydown", (e) => {
      if (
        ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "I" || e.key === "J")) ||
        e.key === "U"
      ) {
        e.preventDefault();
      }
    });

    return () => {
      document.removeEventListener("wheel", (e) => {
        if (e.ctrlKey) {
          e.preventDefault();
        }
      });

      document.removeEventListener("keydown", (e) => {
        if ((e.ctrlKey || e.metaKey) && (e.key === "+" || e.key === "-" || e.key === "0")) {
          e.preventDefault();
        }
      });

      document.removeEventListener("keydown", (e) => {
        if (
          ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "I" || e.key === "J")) ||
          e.key === "U"
        ) {
          e.preventDefault();
        }
      });
    };
  }, []);

  // Show loading screen if authentication or app loading is still in progress
  if (authLoading || appLoading) {
    return <Loading />;
  }

  return (
    <Suspense fallback={<Loading />}>
      <Router>
        <ConditionalHeader user={user} />
        <Routes>
          <Route path="/login" element={user ? <Navigate to="/" /> : <LoginPage />} />
          <Route path="/" element={user ? <HomePage /> : <Navigate to="/login" />} />
          <Route path="/hivee" element={user ? <HiveePage /> : <Navigate to="/login" />} />
          <Route
            path="/chat/:chatRoomId"
            element={user ? <ChatInterface currentUser={user} /> : <Navigate to="/login" />}
          />
          <Route path="/explore" element={user ? <Explore /> : <Navigate to="/login" />} />
          <Route path="/settings" element={user ? <Settings /> : <Navigate to="/login" />} />
          <Route path="/user/:userId" element={user ? <UserProfile /> : <Navigate to="/login" />} />
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
      </Router>
    </Suspense>
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
