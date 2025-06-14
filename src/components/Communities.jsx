import React, { useState, useEffect } from 'react';
import { getUserCommunities } from '../utils/communityManager';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { 
  FaGraduationCap, 
  FaUsers, 
  FaCalendarAlt, 
  FaBullhorn,
  FaBook,
  FaHashtag
} from 'react-icons/fa';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const Communities = () => {
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const navigate = useNavigate();

  // Dark mode detection
  useEffect(() => {
    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDarkMode(prefersDarkMode);

    const handleThemeChange = (e) => {
      setIsDarkMode(e.matches);
    };

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', handleThemeChange);

    return () => {
      mediaQuery.removeEventListener('change', handleThemeChange);
    };
  }, []);

  // Auth state
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUserId(user.uid);
      } else {
        setCurrentUserId(null);
        navigate('/login');
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  // Fetch communities
  useEffect(() => {
    const fetchCommunities = async () => {
      if (!currentUserId) return;
      
      try {
        const userCommunities = await getUserCommunities(currentUserId);
        setCommunities(userCommunities);
      } catch (error) {
        console.error('Error fetching communities:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCommunities();
  }, [currentUserId]);

  const getChannelIcon = (channelName) => {
    switch (channelName.toLowerCase()) {
      case 'announcements':
        return <FaBullhorn className="text-red-500" />;
      case 'academics':
        return <FaBook className="text-blue-500" />;
      case 'events':
        return <FaCalendarAlt className="text-green-500" />;
      default:
        return <FaHashtag className="text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'bg-black' : 'bg-gray-50'} flex items-center justify-center`}>
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 border-8 border-gray-200 dark:border-gray-700 rounded-full"></div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 border-8 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          </div>
          <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Loading communities...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'} transition-colors duration-300`}>
      {/* Header */}
      <div className={`${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} border-b sticky top-0 z-10`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <FaUsers className="text-white text-xl" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">My Communities</h1>
                <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {communities.length} communit{communities.length !== 1 ? 'ies' : 'y'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Communities Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {communities.length === 0 ? (
          <div className="text-center py-12">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
              <FaUsers className={`text-4xl ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
            </div>
            <h3 className={`text-xl font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              No communities found
            </h3>
            <p className={`${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
              You'll automatically join your college community after signup.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {communities.map((community, index) => (
              <motion.div
                key={community.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.3 }}
                className={`${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} rounded-2xl border shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group cursor-pointer`}
                onClick={() => navigate(`/community/${community.id}`)}
              >
                {/* Community Header */}
                <div className="relative h-32 bg-gradient-to-r from-blue-500 to-purple-600">
                  <div className="absolute inset-0 bg-black/20" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                        <FaGraduationCap className="text-white text-xl" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-bold text-lg truncate">
                          {community.name}
                        </h3>
                        <p className="text-white/80 text-sm">
                          {community.type === 'college' ? 'College Community' : 'Community'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Community Content */}
                <div className="p-6">
                  <p className={`text-sm mb-4 line-clamp-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {community.description}
                  </p>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {community.memberCount || 0}
                      </div>
                      <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Members
                      </div>
                    </div>
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {community.stats?.postsCount || 0}
                      </div>
                      <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Posts
                      </div>
                    </div>
                  </div>

                  {/* Tags */}
                  {community.tags && community.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {community.tags.slice(0, 3).map((tag, tagIndex) => (
                        <span
                          key={tagIndex}
                          className={`px-2 py-1 text-xs rounded-full ${
                            isDarkMode 
                              ? 'bg-gray-800 text-gray-300' 
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Hover Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Communities;