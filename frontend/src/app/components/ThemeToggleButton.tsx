'use client';

import { FaMoon, FaSun } from 'react-icons/fa';

type ButtonProps = {
  onClick: () => void;
};

const LightModeButton = ({ onClick }: ButtonProps) => (
  <button
    onClick={onClick}
    className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 w-10 h-10 flex items-center justify-center transition-colors duration-300"
    aria-label="Switch to dark mode"
  >
    <FaMoon className="text-xl text-fantasy-text dark:text-[var(--fantasy-text)]" />
  </button>
);

const DarkModeButton = ({ onClick }: ButtonProps) => (
  <button
    onClick={onClick}
    className="p-2 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 w-10 h-10 flex items-center justify-center transition-colors duration-300"
    aria-label="Switch to light mode"
  >
    <FaSun className="text-xl text-fantasy-gold dark:text-[var(--fantasy-gold)]" />
  </button>
);

type ThemeToggleButtonProps = {
  onToggle: () => void;
  isDarkMode: boolean;
};

const ThemeToggleButton = ({ onToggle, isDarkMode }: ThemeToggleButtonProps) => {
  return isDarkMode ? (
    <DarkModeButton onClick={onToggle} />
  ) : (
    <LightModeButton onClick={onToggle} />
  );
};

export default ThemeToggleButton;
