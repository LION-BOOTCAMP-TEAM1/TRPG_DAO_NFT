// app\components\ThemeToggleButton.js

import { FaMoon, FaSun } from 'react-icons/fa';

const ThemeToggleButton = ({ onToggle, isDarkMode }) => {
  return (
    <button onClick={onToggle} className="p-2 rounded-lg hover:bg-gray-600">
      {isDarkMode ? (
        <FaSun className="text-xl" />
      ) : (
        <FaMoon className="text-xl" />
      )}
    </button>
  );
};

export default ThemeToggleButton;
