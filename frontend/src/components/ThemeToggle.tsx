import React from 'react';
import { IoMoon, IoSunny } from 'react-icons/io5';

import { useTheme } from '../hooks/useTheme';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 dark:bg-[#313131] border border-gray-300 dark:border-[#3f3f3f] text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-[#444] transition-colors duration-200"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? (
        // Moon icon for dark mode
        <IoMoon />
      ) : (
        // Sun icon for light mode
        <IoSunny />
      )}
    </button>
  );
};
