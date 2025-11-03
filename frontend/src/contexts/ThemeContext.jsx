import React, { createContext, useState, useContext, useEffect } from 'react';

// 1. Create the context
const ThemeContext = createContext();

// 2. Create a provider
export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(false);

  // Optional: Persist theme in localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') setIsDark(true);
  }, []);

  const toggleTheme = () => {
    setIsDark(prev => {
      const newTheme = !prev;
      localStorage.setItem('theme', newTheme ? 'dark' : 'light');
      return newTheme;
    });
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// 3. Create a custom hook for easy access
export const useTheme = () => useContext(ThemeContext);
