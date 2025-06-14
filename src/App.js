import React, { useState, useEffect, Suspense, startTransition } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  useParams,
  useNavigate,
} from "react-router-dom";
import { auth } from "./Pages/firebaseConfig";
import { AnimatePresence, motion } from "framer-motion";
import Loading from "./components/Loading";
import KnowledgeHub from "./components/KnowledgeHub/KnowledgeHub";
import Communities from './components/Communities';
import SocialConnect from './Pages/SocialConnect';
import { ThemeProvider } from './context/ThemeContext';
// Import navigation components
import SidebarLeft from "./components/SidebarLeft";
import BottomBar from "./components/BottomBar";

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
const Notification = React.lazy(() => import("./Pages/NotificationPage"));
const Stories = React.lazy(() => import("./components/Stories"));
const MarketPlacePage = React.lazy(() => import("./Pages/MarketPlacePage"));

function AppWrapper() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      startTransition(() => {
        if (user && user.emailVerified) {
          setUser(user);
        } else {
          setUser(null);
        }
        setAuthLoading(false);
      });
    });
    return () => unsubscribe();
  }, []);

  if (authLoading) {
    return <Loading />;
  }

  return (
    <ThemeProvider>
      <Router>
        <AppContent user={user} />
      </Router>
    </ThemeProvider>
  );
}

function AppContent({ user }) {
  const location = useLocation();
  const [isStoryActive, setIsStoryActive] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Check if current route is a story page
  useEffect(() => {
    setIsStoryActive(location.pathname === "/stories");
  }, [location.pathname]);

  // Toggle sidebar collapsed state
  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };  
  
  return (
    <>
      <ConditionalHeader user={user} location={location} />
      
      {/* Always include SidebarLeft for desktop */}
      {user && <SidebarLeft currentUser={user} isCollapsed={isSidebarCollapsed} toggleCollapse={toggleSidebar} />}
      
      {/* Main content area with proper spacing for sidebar */}
      <div className={`transition-all duration-300 ${
        user ? (isSidebarCollapsed ? "lg:ml-20" : "lg:ml-72") : ""
      }`}>
        {/* Removed wrapping Suspense to prevent loading screen on each navigation */}
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
                path="/community/:communityId" 
                element={<CommunityRedirect />} 
              />
              <Route
                path="/community/:communityId/channel/:channelId"
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
              path="/social-connect"
              element={user ? <AnimatedPage><SocialConnect currentUser={user} /></AnimatedPage> : <Navigate to="/login" />}
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
              <Route path="/communities" element={<Communities />} />
              <Route
                path="/marketplace"
                element={user ? <AnimatedPage><MarketPlacePage /></AnimatedPage> : <Navigate to="/login" />}
              />
            </Routes>
          </AnimatePresence>
      </div>
      
      {/* Always include BottomBar for mobile */}
      {user && <BottomBar isStoryActive={isStoryActive} />}
    </>
  );
}

const ConditionalHeader = ({ user, location }) => {
  // Only show header on homepage
  const showHeaderPaths = ["/"];

  const shouldShowHeader = showHeaderPaths.includes(location.pathname);

  // Show header only on homepage and only on mobile/tablet (lg:hidden)
  return shouldShowHeader && (
    <div className="lg:hidden">
      <Suspense fallback={<div className="h-16 bg-white dark:bg-black"></div>}>
        <Header user={user} />
      </Suspense>
    </div>
  );
};

const AnimatedPage = ({ children }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      transition={{ duration: 0.5 }}
    >
      {children}
    </motion.div>
  );
};



// Create a redirect component to handle URLs without channel
const CommunityRedirect = () => {
  const { communityId } = useParams();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Default to "general" channel
    navigate(`/community/${communityId}/channel/general`);
  }, [communityId, navigate]);
  
  return <div>Redirecting...</div>;
};

export default AppWrapper;