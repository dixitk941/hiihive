import React, { useState, useEffect } from 'react';

const College = () => {
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [colleges, setColleges] = useState(['All', 'College A', 'College B', 'College C']);
  const [selectedCollege, setSelectedCollege] = useState('All');

  useEffect(() => {
    // Hardcoded sample data for testing
    const sampleEvents = [
      {
        id: 1,
        name: 'Orientation Day',
        date: '2023-09-01',
        time: '10:00 AM',
        description: 'Welcome event for new students to get acquainted with the campus and faculty.',
        college: 'College A'
      },
      {
        id: 2,
        name: 'Tech Talk',
        date: '2023-09-15',
        time: '2:00 PM',
        description: 'A talk on the latest trends in technology by industry experts.',
        college: 'College B'
      },
      {
        id: 3,
        name: 'Career Fair',
        date: '2023-10-01',
        time: '9:00 AM',
        description: 'An opportunity for students to meet potential employers and learn about job opportunities.',
        college: 'College C'
      }
    ];

    setEvents(sampleEvents);
    setFilteredEvents(sampleEvents); // Initially, show all events
  }, []);

  const handleCollegeChange = (event) => {
    const selected = event.target.value;
    setSelectedCollege(selected);

    if (selected === 'All') {
      setFilteredEvents(events);
    } else {
      const filtered = events.filter(event => event.college === selected);
      setFilteredEvents(filtered);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-gray-900 to-gray-800 text-white p-6">
      <h1 className="text-5xl font-extrabold text-center mt-16 mb-4">College Events</h1>
      <p className="text-center italic text-gray-400 mb-12">Stay updated with the latest events</p>
      <div className="max-w-4xl mx-auto mb-8">
        <label htmlFor="college-select" className="block text-lg font-medium text-gray-300 mb-2">Select College:</label>
        <select
          id="college-select"
          value={selectedCollege}
          onChange={handleCollegeChange}
          className="w-full p-3 bg-gray-800 text-white rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {colleges.map((college, index) => (
            <option key={index} value={college}>{college}</option>
          ))}
        </select>
      </div>
      <section className="max-w-4xl mx-auto bg-gray-800 p-8 rounded-lg shadow-lg">
        {filteredEvents.length > 0 ? (
          <ul className="space-y-6">
            {filteredEvents.map(event => (
              <li key={event.id} className="bg-gray-700 p-6 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold text-blue-400 mb-2">{event.name}</h2>
                <p className="text-gray-400 mb-1">
                  <strong>Date:</strong> {event.date}
                </p>
                <p className="text-gray-400 mb-1">
                  <strong>Time:</strong> {event.time}
                </p>
                <p className="text-gray-300">{event.description}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-400">No events available.</p>
        )}
      </section>
    </div>
  );
};

export default College;