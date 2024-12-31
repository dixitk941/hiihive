import React from "react";

const Footer = () => {
  return (
<footer className="bg-black text-gray-800 py-6 shadow-lg mt-10 dark:bg-black dark:text-white">
<div className="container mx-auto text-center px-4 dark:text-white">
        <p className="text-lg font-semibold mb-2">
          Powered by{" "}
          <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-600">
            AINOR
          </span>
        </p>
        <p className="text-sm text-gray-600">
          Building the Future of Technology, One Step at a Time
        </p>
      </div>
    </footer>
  );
};

export default Footer;
