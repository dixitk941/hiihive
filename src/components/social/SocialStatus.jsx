import React, { useState } from 'react';
import { FiSmile, FiSend, FiHeart } from 'react-icons/fi';

const SocialStatus = () => {
  const [selectedMood, setSelectedMood] = useState(null);
  const [statusText, setStatusText] = useState('');

  const moods = [
    { emoji: '😊', label: 'Happy', color: 'yellow', bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
    { emoji: '😴', label: 'Tired', color: 'blue', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { emoji: '🤯', label: 'Stressed', color: 'red', bg: 'bg-red-50 dark:bg-red-900/20' },
    { emoji: '🎉', label: 'Excited', color: 'green', bg: 'bg-green-50 dark:bg-green-900/20' },
    { emoji: '💪', label: 'Motivated', color: 'purple', bg: 'bg-purple-50 dark:bg-purple-900/20' },
    { emoji: '🤔', label: 'Thinking', color: 'gray', bg: 'bg-gray-50 dark:bg-gray-800' }
  ];

  const handleMoodSelect = (mood) => {
    setSelectedMood(mood);
  };

  const handleShareStatus = () => {
    if (!selectedMood && !statusText.trim()) return;
    
    console.log('Sharing status:', {
      mood: selectedMood,
      text: statusText
    });
    
    // Reset form
    setSelectedMood(null);
    setStatusText('');
    
    // Add haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 mb-6">
      {/* Compact Header */}
      <div className="px-4 py-4 border-b border-gray-100 dark:border-gray-800">
        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center">
          <FiSmile className="w-4 h-4 mr-2 text-blue-600 dark:text-blue-400" />
          Share your vibe
        </h3>
      </div>
      
      <div className="p-4">
        {/* Compact Mood Selection - 2 rows of 3 */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {moods.map(mood => (
            <button
              key={mood.label}
              onClick={() => handleMoodSelect(mood)}
              className={`p-3 rounded-xl border transition-all duration-200 ${
                selectedMood?.label === mood.label
                  ? `border-blue-400 dark:border-blue-500 ${mood.bg} scale-105 shadow-sm`
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <div className="text-xl mb-1">{mood.emoji}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">{mood.label}</div>
            </button>
          ))}
        </div>

        {/* Inline Status Input - Combined with mood display */}
        <div className="space-y-3">
          {/* Status Text Input - Compact */}
          <div className="relative">
            <textarea
              value={statusText}
              onChange={(e) => setStatusText(e.target.value)}
              placeholder={selectedMood ? `Feeling ${selectedMood.label.toLowerCase()}... what's happening?` : "What's on your mind?"}
              className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
              rows="2"
              maxLength={200}
            />
            
            {/* Selected Mood Indicator - Fixed dark theme */}
            {selectedMood && (
              <div className="absolute top-2 right-2 flex items-center space-x-1 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600">
                <span className="text-sm">{selectedMood.emoji}</span>
                <span className="text-xs text-gray-600 dark:text-gray-300 font-medium">{selectedMood.label}</span>
              </div>
            )}
          </div>
          
          {/* Bottom Row - Character count and Share button */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {statusText.length}/200
              </span>
              {(selectedMood || statusText.trim()) && (
                <span className="text-xs text-green-600 dark:text-green-400 flex items-center">
                  <span className="w-1.5 h-1.5 bg-green-500 dark:bg-green-400 rounded-full mr-1"></span>
                  Ready
                </span>
              )}
            </div>
            
            <button 
              onClick={handleShareStatus}
              disabled={!selectedMood && !statusText.trim()}
              className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 transform hover:scale-105 active:scale-95"
            >
              <FiSend className="w-3.5 h-3.5" />
              <span>Share</span>
            </button>
          </div>
        </div>

        {/* Compact Recent Updates */}
        <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Recent Vibes</h4>
            <button className="text-xs text-blue-600 dark:text-blue-400 hover:underline">View all</button>
          </div>
          
          <div className="space-y-2">
            {[
              { name: 'Alex', mood: '😊', text: 'Just aced my presentation!', time: '2m', likes: 5 },
              { name: 'Priya', mood: '📚', text: 'Study session at the library', time: '15m', likes: 2 },
              { name: 'Rahul', mood: '🎉', text: 'Got selected for internship!', time: '1h', likes: 12 }
            ].slice(0, 3).map((update, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200">
                <span className="text-lg flex-shrink-0">{update.mood}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 dark:text-white">
                    <span className="font-medium">{update.name}</span>
                    <span className="text-gray-600 dark:text-gray-400 ml-1">{update.text}</span>
                  </p>
                  <div className="flex items-center space-x-3 mt-1">
                    <span className="text-xs text-gray-500 dark:text-gray-400">{update.time}</span>
                    <button className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors">
                      <FiHeart className="w-3 h-3" />
                      <span>{update.likes}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SocialStatus;