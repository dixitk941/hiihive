import React, { useEffect, useState } from 'react';

const TrendingHashtags = () => {
  const [hashtags, setHashtags] = useState([]);

  // Simulate an API call to fetch trending hashtags
  useEffect(() => {
    const fetchTrendingHashtags = async () => {
      // Replace this with your API endpoint or logic to fetch hashtags
      const fakeApiResponse = [
        'ReactJS',
        'WebDevelopment',
        'AI',
        'HiiHiveLaunch',
        'JavaScript',
        'TailwindCSS',
        'OpenSource',
        'CloudComputing',
        'MVP',
        'TrendingNow',
      ];
      setHashtags(fakeApiResponse);
    };

    fetchTrendingHashtags();
  }, []);

  return (
    <div className="p-4 bg-white shadow-md rounded-lg">
      <h2 className="text-xl font-bold mb-4">Trending Hashtags</h2>
      <ul className="space-y-2">
        {hashtags.map((hashtag, index) => (
          <li key={index} className="text-blue-500 hover:underline">
            #{hashtag}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TrendingHashtags;
