import React, { createContext, useState, useEffect, useContext } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Only check localStorage, ignore system preference completely
    const savedTheme = localStorage.getItem('theme');
    
    // Default to light mode if no saved preference
    const initialDarkMode = savedTheme === 'dark';
    
    setIsDarkMode(initialDarkMode);
    applyTheme(initialDarkMode);
    
    // No system preference listener needed
  }, []);

  // Function to apply theme to HTML and body elements
  const applyTheme = (darkMode) => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  // Toggle function that components will call
  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    applyTheme(newDarkMode);
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);