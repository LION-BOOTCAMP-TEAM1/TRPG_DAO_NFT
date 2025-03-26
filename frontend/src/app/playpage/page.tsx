'use client';

import { useState } from 'react';
import Header from '../components/Header';
import ThemeProvider from '../components/ThemeProvider';

export default function PlayPage() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };
  return (
    <ThemeProvider isDarkMode={isDarkMode}>
      <div>
        <Header onToggle={toggleTheme} isDarkMode />
      </div>
    </ThemeProvider>
  );
}
