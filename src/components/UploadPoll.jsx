// PollPage.js
import React, { useState } from 'react';
import { getAuth } from 'firebase/auth';
import { ref, push, set } from 'firebase/database';
import { dbRealtime } from './firebaseConfig';

const PollPage = () => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']); // Only 2 options allowed
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Create Poll
  const handlePollSubmit = async (e) => {
    e.preventDefault();

    // Ensure options has exactly 2 non-empty options
    if (options.length !== 2 || options.some(option => option.trim() === '')) {
      setError('Please provide exactly 2 options.');
      console.error('Invalid options:', options);
      return;
    }

    if (!question.trim()) {
      setError('Question is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        setError('You must be logged in to post a poll.');
        setIsSubmitting(false);
        return;
      }

      // Generate a new poll ID using push
      const newPollRef = ref(dbRealtime, 'polls');
      const newPollId = push(newPollRef).key;

      // Poll data structure
      const pollData = {
        question,
        options,
        votes: Array(options.length).fill(0), // Initialize vote count for each option
        createdBy: user.uid,
        timestamp: new Date().toISOString(),
      };

      // Save poll data to Realtime Database using the generated poll ID
      await set(ref(dbRealtime, `polls/${newPollId}`), pollData);
      setError('');
      setIsSubmitting(false);
      setQuestion('');
      setOptions(['', '']); // Reset options to only 2
    } catch (error) {
      console.error('Error creating poll: ', error);
      setError('Failed to create poll.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-semibold mb-4 text-center">Create a Poll</h2>
      {error && <p className="text-red-600 text-center mb-4">{error}</p>}
      <form onSubmit={handlePollSubmit}>
        <div className="mb-4">
          <label htmlFor="question" className="block text-gray-700">Poll Question</label>
          <input
            id="question"
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Enter your poll question"
            className="w-full px-4 py-2 border border-gray-300 rounded-md mt-2"
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700">Options</label>
          {options.map((option, index) => (
            <div key={index} className="flex items-center space-x-2 mb-2">
              <input
                type="text"
                value={option}
                onChange={(e) => {
                  const newOptions = [...options];
                  newOptions[index] = e.target.value;
                  setOptions(newOptions);
                }}
                placeholder={`Option ${index + 1}`}
                className="w-full px-4 py-2 border border-gray-300 rounded-md"
              />
            </div>
          ))}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full py-2 bg-blue-600 text-white rounded-lg ${isSubmitting ? 'opacity-50' : ''}`}
        >
          {isSubmitting ? 'Submitting...' : 'Create Poll'}
        </button>
      </form>
    </div>
  );
};

export default PollPage;
