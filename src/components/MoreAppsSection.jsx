import React from 'react';
import { FiExternalLink } from 'react-icons/fi';

const MoreAppsSection = () => {
  const apps = [
    {
      name: 'Ainor',
      link: 'https://ainoruniverse.vercel.app',
    },
    {
      name: 'Mentor Connect',
      link: 'https://mentorconnectt.vercel.app',
    },
    {
        name: 'NeoCodeNex',
        link: 'https://Neocodenex.tech',
      },
      {
        name: 'Gez Connect',
        link: 'https://genzconnectt.vercel.app',
      },
    // Add more apps as needed
  ];

  return (
<div className="max-w-3xl mx-auto p-4 dark:bg-black dark:text-white">
<h2 className="text-2xl font-bold text-center mb-6">More Apps</h2>
      <ul className="space-y-4">
        {apps.map((app, index) => (
          <li key={index} className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 flex items-center">
            <div className="flex-grow flex items-center">
              <div className="bg-gray-200 rounded-full p-2 mr-4">
                <FiExternalLink className="text-blue-600" />
              </div>
              <a
                href={app.link}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-blue-600 hover:text-blue-800 text-xl font-medium"
              >
                {app.name}
              </a>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default MoreAppsSection;