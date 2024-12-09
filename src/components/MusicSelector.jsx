import React, { useState, useEffect, useRef } from 'react';
import WaveSurfer from 'wavesurfer.js';

const MusicSelector = ({ onSelectMusic, musicLibrary }) => {
  const [selectedMusic, setSelectedMusic] = useState(null);
  const [musicSegment, setMusicSegment] = useState([0, 60]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const waveSurferRef = useRef(null);
  const [waveSurfer, setWaveSurfer] = useState(null);

  useEffect(() => {
    if (waveSurferRef.current && !waveSurfer) {
      const ws = WaveSurfer.create({
        container: waveSurferRef.current,
        waveColor: '#ddd',
        progressColor: '#3b82f6',
        cursorColor: '#ff0000',
        height: 100,
        responsive: true,
        scrollParent: false,
      });
      setWaveSurfer(ws);
    }
  }, []);

  useEffect(() => {
    if (selectedMusic && waveSurfer) {
      waveSurfer.load(selectedMusic.url);
      waveSurfer.on('ready', () => {
        const duration = waveSurfer.getDuration();
        if (duration < 60) setMusicSegment([0, duration]);
      });
    }
  }, [selectedMusic, waveSurfer]);

  const handleMusicSelect = (music) => {
    setSelectedMusic(music);
    onSelectMusic(music); // Pass selected music back to parent
  };

  const handleMusicSegmentChange = (start, end) => {
    setMusicSegment([start, end]);
    if (waveSurfer) {
      waveSurfer.play(start, end);
    }
  };

  const togglePlay = () => {
    if (waveSurfer) {
      if (isPlaying) {
        waveSurfer.pause();
      } else {
        waveSurfer.play(musicSegment[0], musicSegment[1]);
      }
      setIsPlaying(!isPlaying);
    }
  };

  const filteredMusic = musicLibrary.filter((track) =>
    track.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 bg-white rounded-lg shadow-lg">
      <div className="mb-4">
        <input
          type="text"
          className="w-full p-2 border border-gray-300 rounded"
          placeholder="Search music..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        {filteredMusic.map((track) => (
          <div
            key={track.id}
            className={`p-2 border rounded-lg flex items-center justify-between ${
              selectedMusic === track ? 'bg-blue-100 border-blue-500' : ''
            }`}
          >
            <span>{track.name}</span>
            <button
              onClick={() => handleMusicSelect(track)}
              className="text-blue-500 font-bold"
            >
              Select
            </button>
          </div>
        ))}
      </div>

      {selectedMusic && (
        <>
          <div ref={waveSurferRef} className="my-4"></div>
          <div className="flex justify-between items-center">
            <label>
              Start:
              <input
                type="number"
                value={musicSegment[0]}
                min="0"
                max={musicSegment[1] - 1}
                onChange={(e) =>
                  handleMusicSegmentChange(Number(e.target.value), musicSegment[1])
                }
                className="ml-2 p-1 border rounded w-20"
              />
            </label>
            <label>
              End:
              <input
                type="number"
                value={musicSegment[1]}
                min={musicSegment[0] + 1}
                max={waveSurfer ? waveSurfer.getDuration() : 60}
                onChange={(e) =>
                  handleMusicSegmentChange(musicSegment[0], Number(e.target.value))
                }
                className="ml-2 p-1 border rounded w-20"
              />
            </label>
          </div>
          <button
            onClick={togglePlay}
            className="bg-blue-500 text-white p-2 rounded-lg w-full mt-4"
          >
            {isPlaying ? 'Pause' : 'Play'}
          </button>
        </>
      )}
    </div>
  );
};

export default MusicSelector;
