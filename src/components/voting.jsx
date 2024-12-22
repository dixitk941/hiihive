// Voting.js
import React, { useState, useEffect } from 'react';
import { ref, update, onValue } from 'firebase/database';
import { dbRealtime } from './firebaseConfig';

const Voting = ({ pollId }) => {
  const [pollData, setPollData] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [error, setError] = useState('');

  // Load Poll Data for Voting
  useEffect(() => {
    if (pollId) {
      const pollRef = ref(dbRealtime, `polls/${pollId}`);
      onValue(pollRef, (snapshot) => {
        if (snapshot.exists()) {
          setPollData(snapshot.val());
        } else {
          setError('Poll not found.');
        }
      }, { onlyOnce: true });
    }
  }, [pollId]);

  // Vote for a poll option
  const handleVote = async () => {
    if (selectedOption === null) {
      setError('Please select an option.');
      return;
    }
    try {
      const pollRef = ref(dbRealtime, `polls/${pollId}/votes`);
      const currentVotes = pollData.votes;
      currentVotes[selectedOption] += 1; // Increment the vote for the selected option

      // Update vote count in the Realtime Database
      await update(pollRef, currentVotes);
      setError('');
      alert('Vote submitted successfully!');
    } catch (err) {
      setError('Error submitting vote.');
    }
  };

  return (
    <div>
      {error && <p className="text-red-600">{error}</p>}
      {pollData && (
        <>
          <h2 className="text-2xl font-semibold mb-4 text-center">{pollData?.question}</h2>
          {pollData?.options.map((option, index) => (
            <div key={index} className="flex items-center mb-4">
              <input
                type="radio"
                id={`option-${index}`}
                name="poll-option"
                value={index}
                onChange={() => setSelectedOption(index)}
                className="mr-2"
              />
              <label htmlFor={`option-${index}`} className="text-gray-700">{option}</label>
            </div>
          ))}
          <button
            onClick={handleVote}
            className="w-full py-2 bg-blue-600 text-white rounded-lg"
          >
            Vote
          </button>
        </>
      )}
    </div>
  );
};

export default Voting;
