import React, { useState, useEffect } from 'react';
import { FiCalendar, FiMapPin, FiUsers, FiClock } from 'react-icons/fi';

const CampusEvents = () => {
  const [events, setEvents] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    // Mock events data
    const mockEvents = [
      {
        id: 1,
        title: 'College Fest 2024',
        description: 'Annual college festival with music, dance, and cultural events',
        date: 'Dec 25, 2024',
        time: '6:00 PM',
        location: 'Main Auditorium',
        type: 'party',
        organizer: 'Student Council',
        attending: 245,
        image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400'
      },
      {
        id: 2,
        title: 'Study Group - Physics',
        description: 'Group study session for upcoming physics exam',
        date: 'Dec 20, 2024',
        time: '4:00 PM',
        location: 'Library Room 201',
        type: 'study',
        organizer: 'Physics Club',
        attending: 12,
        image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400'
      },
      {
        id: 3,
        title: 'Basketball Tournament',
        description: 'Inter-college basketball championship',
        date: 'Dec 22, 2024',
        time: '10:00 AM',
        location: 'Sports Complex',
        type: 'sports',
        organizer: 'Sports Committee',
        attending: 89,
        image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400'
      }
    ];
    setEvents(mockEvents);
  }, []);

  const filteredEvents = events.filter(event => 
    filter === 'all' || event.type === filter
  );

  const handleJoinEvent = (eventId) => {
    console.log('Joining event:', eventId);
    // Add join event logic here
  };

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <FiCalendar className="w-5 h-5 mr-2 text-pink-600 dark:text-pink-400" />
          Campus Events
        </h3>
        
        {/* Fixed Event Filters - Proper spacing and scroll */}
        <div className="relative">
          <div 
            className="flex space-x-3 overflow-x-auto scrollbar-hide pb-2" 
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {[
              { key: 'all', label: 'All Events', emoji: '🎯' },
              { key: 'party', label: 'Parties', emoji: '🎉' },
              { key: 'study', label: 'Study Groups', emoji: '📚' },
              { key: 'sports', label: 'Sports', emoji: '⚽' }
            ].map(filterOption => (
              <button
                key={filterOption.key}
                onClick={() => setFilter(filterOption.key)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex-shrink-0 whitespace-nowrap ${
                  filter === filterOption.key
                    ? 'bg-pink-100 dark:bg-pink-900/40 text-pink-800 dark:text-pink-300 scale-105 shadow-sm'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
                style={{ minWidth: 'fit-content' }}
              >
                <span>{filterOption.emoji}</span>
                <span>{filterOption.label}</span>
              </button>
            ))}
          </div>
          
          {/* Gradient fade for scroll indication */}
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white dark:from-gray-900 to-transparent pointer-events-none" />
        </div>
      </div>

      {/* Events List */}
      {filteredEvents.map(event => (
        <CampusEventCard 
          key={event.id} 
          event={event} 
          onJoin={handleJoinEvent}
        />
      ))}
    </div>
  );
};

const CampusEventCard = ({ event, onJoin }) => {
  // Function to get event type badge styles with proper dark theme support
  const getEventTypeBadge = (type) => {
    const badges = {
      party: {
        bg: 'bg-pink-100 dark:bg-pink-900/40',
        text: 'text-pink-800 dark:text-pink-300',
        label: '🎉 Party'
      },
      study: {
        bg: 'bg-blue-100 dark:bg-blue-900/40',
        text: 'text-blue-800 dark:text-blue-300',
        label: '📚 Study'
      },
      sports: {
        bg: 'bg-green-100 dark:bg-green-900/40',
        text: 'text-green-800 dark:text-green-300',
        label: '⚽ Sports'
      },
      default: {
        bg: 'bg-purple-100 dark:bg-purple-900/40',
        text: 'text-purple-800 dark:text-purple-300',
        label: '🎭 Cultural'
      }
    };
    
    return badges[type] || badges.default;
  };

  const badgeStyle = getEventTypeBadge(event.type);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 hover:shadow-lg dark:hover:shadow-2xl transition-shadow">
      {/* Event Image */}
      <div className="h-32 bg-gradient-to-r from-pink-400 to-purple-500 relative overflow-hidden">
        <img 
          src={event.image} 
          alt={event.title}
          className="w-full h-full object-cover opacity-80"
        />
        <div className="absolute top-3 right-3">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${badgeStyle.bg} ${badgeStyle.text}`}>
            {badgeStyle.label}
          </span>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-1">{event.title}</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">by {event.organizer}</p>
            <p className="text-gray-700 dark:text-gray-300 text-sm">{event.description}</p>
          </div>
        </div>

        {/* Event Details */}
        <div className="grid grid-cols-2 gap-3 mb-4 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center space-x-2">
            <FiCalendar className="w-4 h-4 text-pink-500 dark:text-pink-400" />
            <span>{event.date}</span>
          </div>
          <div className="flex items-center space-x-2">
            <FiClock className="w-4 h-4 text-pink-500 dark:text-pink-400" />
            <span>{event.time}</span>
          </div>
          <div className="flex items-center space-x-2">
            <FiMapPin className="w-4 h-4 text-pink-500 dark:text-pink-400" />
            <span>{event.location}</span>
          </div>
          <div className="flex items-center space-x-2">
            <FiUsers className="w-4 h-4 text-pink-500 dark:text-pink-400" />
            <span>{event.attending} going</span>
          </div>
        </div>

        {/* Action Button */}
        <button 
          onClick={() => onJoin(event.id)}
          className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-[1.02]"
        >
          I'm Going! 🎉
        </button>
      </div>
    </div>
  );
};

export default CampusEvents;