import React, { useState, useEffect } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db, storage } from "./firebaseConfig";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Link } from "react-router-dom";
import { 
  FiUser, 
  FiEdit3, 
  FiCamera, 
  FiSave, 
  FiX, 
  FiMail, 
  FiBook,
  FiFileText,
  FiSettings,
  FiBell,
  FiShield,
  FiLogOut,
  FiHeart,
  FiBookmark,
  FiEye,
  FiMoon,
  FiSun,
  FiChevronRight,
  FiInfo,
  FiArrowLeft,
  FiMoreHorizontal,
  FiShare2,
  FiLock,
  FiHelpCircle
} from "react-icons/fi";
import { useTheme } from '../context/ThemeContext';

const colleges = [
  "Rajiv Academy For Technology and Management, Mathura",
  "GLA University, Mathura",
  "GL Bajaj, Mathura",
];

const ModernPopUp = ({ onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const hasSeenPopup = localStorage.getItem("hasSeenPopup");
    if (!hasSeenPopup) {
      setIsVisible(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem("hasSeenPopup", "true");
    setIsVisible(false);
    if (onClose) onClose();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-md sm:w-full p-6 sm:p-8 relative animate-slide-up sm:animate-scale-up">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 w-8 h-8 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full flex items-center justify-center transition-colors"
        >
          <FiX className="w-4 h-4" />
        </button>

        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <FiInfo className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Complete Your Profile</h2>
          <p className="text-gray-600 dark:text-gray-400 text-base leading-relaxed">
            Add your details to connect with your college community and unlock all features!
          </p>
        </div>

        <Link
          to="/settings"
          onClick={handleClose}
          className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-200 flex items-center justify-center gap-2 text-lg"
        >
          <FiSettings className="w-6 h-6" />
          Get Started
        </Link>
      </div>
    </div>
  );
};

const Settings = () => {
  const [user, setUser] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState("/default-profile.jpg");
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [college, setCollege] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [popupVisible, setPopupVisible] = useState(false);
  const { isDarkMode, toggleDarkMode } = useTheme();

  useEffect(() => {
    const fetchUserData = async () => {
      if (!auth.currentUser) return;
      
      const userRef = doc(db, "users", auth.currentUser.uid);
      const docSnap = await getDoc(userRef);

      if (docSnap.exists()) {
        const userData = docSnap.data();
        setUser(userData);
        setAvatarUrl(userData.avatar || "/default-profile.jpg");
        setUsername(userData.username || "");
        setFullName(userData.fullName || "");
        setBio(userData.bio || "");
        setCollege(userData.college || "");

        if (!userData.college || !userData.fullName) {
          setPopupVisible(true);
        }
      }
    };

    fetchUserData();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    if (!auth.currentUser) return;
    
    setLoading(true);

    try {
      let uploadedAvatarUrl = avatarUrl;

      if (avatarFile) {
        const avatarRef = ref(storage, `avatars/${auth.currentUser.uid}`);
        const snapshot = await uploadBytes(avatarRef, avatarFile);
        uploadedAvatarUrl = await getDownloadURL(snapshot.ref);
      }

      const userRef = doc(db, "users", auth.currentUser.uid);
      await updateDoc(userRef, {
        avatar: uploadedAvatarUrl,
        username,
        fullName,
        bio,
        college,
      });

      setUser(prev => ({
        ...prev,
        avatar: uploadedAvatarUrl,
        username,
        fullName,
        bio,
        college,
      }));

      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const settingsMenuItems = [
    {
      icon: FiUser,
      title: "Account",
      subtitle: "Privacy, security, account info",
      action: () => {},
      color: "blue"
    },
    {
      icon: FiBell,
      title: "Notifications",
      subtitle: "Push, email, in-app",
      action: () => {},
      color: "green"
    },
    {
      icon: FiLock,
      title: "Privacy & Security",
      subtitle: "Control your privacy",
      action: () => {},
      color: "purple"
    },
    {
      icon: FiHeart,
      title: "Your Activity",
      subtitle: "Posts, likes, comments",
      action: () => {},
      color: "red"
    },
    {
      icon: FiShare2,
      title: "Sharing",
      subtitle: "Manage sharing settings",
      action: () => {},
      color: "orange"
    },
    {
      icon: FiHelpCircle,
      title: "Help & Support",
      subtitle: "Get help, report issues",
      action: () => {},
      color: "indigo"
    }
  ];

  const getColorClasses = (color) => {
    const colors = {
      blue: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
      green: "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
      purple: "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
      red: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400",
      orange: "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400",
      indigo: "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black transition-colors duration-300">
      {popupVisible && <ModernPopUp onClose={() => setPopupVisible(false)} />}

      {/* One UI 7 Style Header */}
      <div className="bg-white dark:bg-gray-900 sticky top-0 z-40 border-b border-gray-200 dark:border-gray-800">
        <div className="px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors sm:hidden">
                <FiArrowLeft className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your account</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleDarkMode}
                className="p-3 rounded-2xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                {isDarkMode ? <FiSun className="w-5 h-5" /> : <FiMoon className="w-5 h-5" />}
              </button>
              <button className="p-3 rounded-2xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                <FiMoreHorizontal className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 py-6 max-w-2xl mx-auto">
        {/* Profile Card - One UI 7 Style */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 mb-6">
          {!isEditing ? (
            <div className="space-y-6">
              {/* Profile Header */}
              <div className="flex items-start gap-4">
                <div className="relative">
                  <img
                    src={avatarUrl}
                    alt="Profile"
                    className="w-20 h-20 rounded-2xl object-cover ring-4 ring-gray-100 dark:ring-gray-800"
                  />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-4 border-white dark:border-gray-900"></div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white truncate">
                    {fullName || "Complete your profile"}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    @{username || "username"}
                  </p>
                  {college && (
                    <div className="flex items-center gap-2 mt-2">
                      <FiBook className="w-4 h-4 text-blue-500" />
                      <span className="text-sm text-gray-600 dark:text-gray-400 truncate">{college}</span>
                    </div>
                  )}
                </div>
                
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl font-semibold hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors text-sm"
                >
                  Edit
                </button>
              </div>

              {/* Bio */}
              {bio && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4">
                  <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{bio}</p>
                </div>
              )}

              {/* Stats - One UI 7 Style Grid */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-2xl p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">24</div>
                  <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">Posts</div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-2xl p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">156</div>
                  <div className="text-xs text-purple-600 dark:text-purple-400 font-medium">Followers</div>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-2xl p-4 text-center">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">89</div>
                  <div className="text-xs text-green-600 dark:text-green-400 font-medium">Following</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Edit Header */}
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Edit Profile</h3>
                <button
                  onClick={() => setIsEditing(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              {/* Avatar Upload - One UI 7 Style */}
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="relative">
                  <img
                    src={avatarUrl}
                    alt="Profile"
                    className="w-24 h-24 rounded-2xl object-cover ring-4 ring-gray-200 dark:ring-gray-700"
                  />
                  <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl cursor-pointer opacity-0 hover:opacity-100 transition-opacity">
                    <FiCamera className="w-8 h-8 text-white" />
                    <input
                      type="file"
                      onChange={handleFileChange}
                      accept="image/*"
                      className="hidden"
                    />
                  </label>
                </div>
                <div className="text-center sm:text-left">
                  <h4 className="font-semibold text-gray-900 dark:text-white">Change Photo</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Upload a new profile picture</p>
                </div>
              </div>

              {/* Form Fields - One UI 7 Style */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    <FiUser className="w-4 h-4" />
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full p-4 bg-gray-50 dark:bg-gray-800 border-0 rounded-2xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-700 transition-all"
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    <FiUser className="w-4 h-4" />
                    Username
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full p-4 bg-gray-50 dark:bg-gray-800 border-0 rounded-2xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-700 transition-all"
                    placeholder="Choose a username"
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    <FiFileText className="w-4 h-4" />
                    Bio
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full p-4 bg-gray-50 dark:bg-gray-800 border-0 rounded-2xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-700 transition-all resize-none"
                    placeholder="Tell us about yourself..."
                    rows="3"
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    <FiBook className="w-4 h-4" />
                    College
                  </label>
                  <select
                    value={college}
                    onChange={(e) => setCollege(e.target.value)}
                    className="w-full p-4 bg-gray-50 dark:bg-gray-800 border-0 rounded-2xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-700 transition-all"
                  >
                    <option value="">Select your college</option>
                    {colleges.map((collegeName, index) => (
                      <option key={index} value={collegeName}>
                        {collegeName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Action Buttons - One UI 7 Style */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-4 px-6 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-2xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={loading}
                  className="flex-1 py-4 px-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl font-semibold hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="relative w-5 h-5">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-5 h-5 border-2 border-white/30 rounded-full"></div>
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        </div>
                      </div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <FiSave className="w-5 h-5" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Settings Menu - One UI 7 Style */}
        <div className="space-y-3">
          {settingsMenuItems.map((item, index) => (
            <button
              key={index}
              onClick={item.action}
              className="w-full bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 p-5 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all active:scale-95"
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${getColorClasses(item.color)}`}>
                <item.icon className="w-6 h-6" />
              </div>
              <div className="flex-1 text-left">
                <div className="font-semibold text-gray-900 dark:text-white text-base">{item.title}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{item.subtitle}</div>
              </div>
              <FiChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          ))}
        </div>

        {/* Sign Out - One UI 7 Style */}
        <div className="mt-6">
          <button 
            onClick={() => {
              if (window.confirm('Are you sure you want to sign out?')) {
                auth.signOut();
              }
            }}
            className="w-full bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-red-200 dark:border-red-800 p-5 flex items-center gap-4 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all active:scale-95"
          >
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/40 rounded-2xl flex items-center justify-center">
              <FiLogOut className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="flex-1 text-left">
              <div className="font-semibold text-red-600 dark:text-red-400 text-base">Sign Out</div>
              <div className="text-sm text-red-500 dark:text-red-400">Sign out from your account</div>
            </div>
            <FiChevronRight className="w-5 h-5 text-red-400" />
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        
        @keyframes scale-up {
          from {
            transform: scale(0.95);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
        
        .animate-scale-up {
          animation: scale-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default Settings;