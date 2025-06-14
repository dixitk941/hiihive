import React, { useState } from 'react';
import { getAuth } from 'firebase/auth';
import { ref, push, set } from 'firebase/database';
import { dbRealtime } from './firebaseConfig';
import { useNavigate } from 'react-router-dom';

const UploadPoll = () => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pollDuration, setPollDuration] = useState(24); // Poll duration in hours
  const navigate = useNavigate();

  // Add option (max 4 options)
  const addOption = () => {
    if (options.length < 4) {
      setOptions([...options, '']);
    }
  };

  // Remove option (min 2 options)
  const removeOption = (index) => {
    if (options.length > 2) {
      const newOptions = options.filter((_, i) => i !== index);
      setOptions(newOptions);
    }
  };

  // Update option
  const updateOption = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  // Create Poll
  const handlePollSubmit = async (e) => {
    e.preventDefault();

    // Validation
    const validOptions = options.filter(option => option.trim() !== '');
    if (validOptions.length < 2) {
      setError('Please provide at least 2 options.');
      return;
    }

    if (!question.trim()) {
      setError('Question is required.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (!user) {
        setError('You must be logged in to create a poll.');
        setIsSubmitting(false);
        return;
      }

      // Generate a new poll ID
      const newPollRef = ref(dbRealtime, 'polls');
      const newPollId = push(newPollRef).key;

      // Calculate expiry time
      const expiryTime = new Date();
      expiryTime.setHours(expiryTime.getHours() + pollDuration);

      // Poll data structure
      const pollData = {
        id: newPollId,
        question: question.trim(),
        options: validOptions,
        votes: Array(validOptions.length).fill(0),
        voters: [], // Track who voted
        createdBy: user.uid,
        createdByName: user.displayName || user.email,
        timestamp: new Date().toISOString(),
        expiryTime: expiryTime.toISOString(),
        duration: pollDuration,
        isActive: true,
        totalVotes: 0
      };

      // Save poll to database
      await set(ref(dbRealtime, `polls/${newPollId}`), pollData);
      
      // Reset form
      setQuestion('');
      setOptions(['', '']);
      setPollDuration(24);
      
      // Navigate to polls or home
      setTimeout(() => {
        setIsSubmitting(false);
        navigate('/');
      }, 1000);

    } catch (error) {
      console.error('Error creating poll:', error);
      setError('Failed to create poll. Please try again.');
      setIsSubmitting(false);
    }
  };

  const durationOptions = [
    { value: 1, label: '1 Hour' },
    { value: 6, label: '6 Hours' },
    { value: 12, label: '12 Hours' },
    { value: 24, label: '1 Day' },
    { value: 72, label: '3 Days' },
    { value: 168, label: '1 Week' }
  ];

  return (
    <div className="min-h-screen transition-colors duration-300 bg-gray-50 dark:bg-black">
      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
            Create Poll
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Ask the community and get their opinions
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 dark:bg-red-500/10 dark:border-red-500/20">
            <p className="text-red-600 dark:text-red-400 text-sm font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handlePollSubmit} className="space-y-6">
          {/* Poll Question */}
          <div className="rounded-3xl p-6 border bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
            <label className="block text-sm font-semibold mb-3 text-gray-900 dark:text-white">
              Poll Question
            </label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="What would you like to ask?"
              rows={3}
              className="w-full p-4 rounded-2xl border bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-blue-500 resize-none transition-all duration-200"
            />
          </div>

          {/* Poll Options */}
          <div className="rounded-3xl p-6 border bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <label className="text-sm font-semibold text-gray-900 dark:text-white">
                Poll Options
              </label>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {options.length}/4 options
              </span>
            </div>

            <div className="space-y-3">
              {options.map((option, index) => (
                <div key={index} className="flex items-center gap-3">
                  {/* Option Number */}
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                    {index + 1}
                  </div>

                  {/* Option Input */}
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    className="flex-1 p-3 rounded-2xl border bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-all duration-200"
                  />

                  {/* Remove Option Button */}
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(index)}
                      className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 bg-red-50 dark:bg-red-500/20 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/30"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Add Option Button */}
            {options.length < 4 && (
              <button
                type="button"
                onClick={addOption}
                className="w-full mt-4 py-3 rounded-2xl border-2 border-dashed transition-all duration-200 flex items-center justify-center gap-2 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-gray-400 hover:text-gray-600 dark:hover:border-gray-500 dark:hover:text-gray-300"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span className="font-medium">Add Option</span>
              </button>
            )}
          </div>

          {/* Poll Duration */}
          <div className="rounded-3xl p-6 border bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
            <label className="block text-sm font-semibold mb-4 text-gray-900 dark:text-white">
              Poll Duration
            </label>
            <div className="grid grid-cols-2 gap-3">
              {durationOptions.map((duration) => (
                <button
                  key={duration.value}
                  type="button"
                  onClick={() => setPollDuration(duration.value)}
                  className={`p-3 rounded-2xl border text-sm font-medium transition-all duration-200 
                    ${pollDuration === duration.value
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                >
                  {duration.label}
                </button>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || !question.trim() || options.filter(o => o.trim()).length < 2}
            className={`w-full py-4 px-6 rounded-2xl font-semibold text-lg transition-all duration-200 
              ${isSubmitting || !question.trim() || options.filter(o => o.trim()).length < 2
                ? 'bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                : 'bg-blue-500 text-white hover:bg-blue-600 active:scale-95 shadow-lg shadow-blue-500/25'
              }`}
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="relative w-5 h-5">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white/30 rounded-full"></div>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                </div>
                <span>Creating Poll...</span>
              </div>
            ) : (
              'Create Poll'
            )}
          </button>
        </form>

        {/* Poll Preview */}
        {question.trim() && options.filter(o => o.trim()).length >= 2 && (
          <div className="mt-8 rounded-3xl p-6 border bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Preview
            </h3>
            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800">
              <p className="font-medium mb-4 text-gray-900 dark:text-white">
                {question}
              </p>
              <div className="space-y-2">
                {options.filter(o => o.trim()).map((option, index) => (
                  <div key={index} className="p-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700">
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {option}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-xs mt-3 text-gray-500 dark:text-gray-400">
                Poll ends in {pollDuration} hour{pollDuration > 1 ? 's' : ''}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadPoll;