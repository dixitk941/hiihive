import React, { useState, useEffect, useRef } from 'react';
import SearchBar from './SearchBar';
import Categories from './Categories';
import ResourceCard from './ResourceCard';
import College from './College';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFire } from '@fortawesome/free-solid-svg-icons';

const KnowledgeHub = () => {
  const [resources, setResources] = useState([]);
  const [filteredResources, setFilteredResources] = useState([]);
  const [categories, setCategories] = useState(['All', 'Programming', 'DSA', 'Web Development']);
  const [timer, setTimer] = useState(0);
  const [streak, setStreak] = useState(0);
  const intervalRef = useRef(null);
  const firestore = getFirestore();
  const [isVisible, setIsVisible] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);

  useEffect(() => {
    // Hardcoded sample data for testing
    const sampleData = [
      {
        id: 1,
        title: 'Introduction to React',
        description: 'Learn the basics of React, a popular JavaScript library for building user interfaces.',
        author: 'John Doe',
        category: 'Programming'
      },
      {
        id: 2,
        title: 'Advanced JavaScript',
        description: 'Deep dive into advanced JavaScript concepts and techniques.',
        author: 'Jane Smith',
        category: 'Programming'
      },
      {
        id: 3,
        title: 'CSS Grid Layout',
        description: 'Master the CSS Grid Layout module and create complex web layouts with ease.',
        author: 'Chris Johnson',
        category: 'Web Development'
      }
    ];

    setResources(sampleData);
    setFilteredResources(sampleData); // Initially, show all resources

    // Uncomment the following code to fetch data from Firestore
    /*
    const fetchResources = async () => {
      const resourceCollection = collection(firestore, 'resources');
      const snapshot = await getDocs(resourceCollection);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setResources(data);
      setFilteredResources(data); // Initially, show all resources
    };

    fetchResources();
    */
  }, []);

  useEffect(() => {
    const savedTimer = localStorage.getItem('timer');
    const savedDate = localStorage.getItem('timerDate');
    const savedStreak = localStorage.getItem('streak');
    const currentDate = new Date().toISOString().split('T')[0];

    if (savedDate !== currentDate) {
      localStorage.setItem('timer', 0);
      localStorage.setItem('timerDate', currentDate);
      setTimer(0);
      if (savedTimer >= 7200) { // 2 hours in seconds
        setStreak(prevStreak => {
          const newStreak = prevStreak + 1;
          localStorage.setItem('streak', newStreak);
          return newStreak;
        });
      } else {
        setStreak(0);
        localStorage.setItem('streak', 0);
      }
    } else if (savedTimer) {
      setTimer(Number(savedTimer));
    }

    if (savedStreak) {
      setStreak(Number(savedStreak));
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        clearInterval(intervalRef.current);
      } else {
        startTimer();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    startTimer();

    return () => {
      clearInterval(intervalRef.current);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    setIsVisible(true);
    const timer = setTimeout(() => {
      setShowWelcome(false);
    }, 3000); // Show welcome message for 3 seconds
    return () => clearTimeout(timer);
  }, []);

  const startTimer = () => {
    intervalRef.current = setInterval(() => {
      setTimer(prevTimer => {
        const newTimer = prevTimer + 1;
        localStorage.setItem('timer', newTimer);
        return newTimer;
      });
    }, 1000);
  };

  const handleSearch = (query) => {
    const filtered = resources.filter(resource =>
      resource.title.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredResources(filtered);
  };

  const handleSelectCategory = (category) => {
    if (category === 'All') {
      setFilteredResources(resources);
    } else {
      const filtered = resources.filter(resource =>
        resource.category === category
      );
      setFilteredResources(filtered);
    }
  };

  return (
    <div>
      {showWelcome && (
        <div className="welcome-message text-center text-2xl font-bold text-white bg-blue-500 p-4 rounded-lg shadow-lg">
          Welcome to Knowledge Hub
        </div>
      )}
      <div className={`relative min-h-screen bg-gradient-to-r from-gray-900 to-gray-800 text-white p-4 sm:p-6 knowledge-hub ${isVisible ? 'knowledge-hub-enter' : ''}`}>
        <div className="absolute top-20 right-4 flex items-center bg-gray-800 p-2 sm:p-3 rounded-lg shadow-lg z-10">
          <FontAwesomeIcon icon={faFire} className="text-red-500 text-xl sm:text-2xl mr-2" />
          <p className="text-sm sm:text-lg">Daily Streak: {streak} {streak === 1 ? 'day' : 'days'}</p>
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-center mt-32 sm:mt-24 mb-4">KnowledgeHub</h1>
        <p className="text-center italic text-gray-400 mb-8 sm:mb-12">by HiiHive</p>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-4">
            <p className="text-sm sm:text-lg">Time spent on this page: {Math.floor(timer / 60)} minutes {timer % 60} seconds</p>
          </div>
          <SearchBar query="" onSearch={handleSearch} />
          <Categories categories={categories} onSelectCategory={handleSelectCategory} />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8 mt-6 sm:mt-10">
            {filteredResources.length > 0 ? (
              filteredResources.map(resource => (
                <ResourceCard key={resource.id} resource={resource} />
              ))
            ) : (
              <p className="text-center col-span-full text-sm sm:text-lg">No resources found.</p>
            )}
          </div>
          <College />
        </div>
      </div>
    </div>
  );
};

export default KnowledgeHub;