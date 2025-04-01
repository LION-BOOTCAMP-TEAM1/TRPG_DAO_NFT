import { useEffect, useState } from 'react';

const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(null);

  useEffect(() => {
    const theme = localStorage.getItem('theme') === 'dark';
    setIsDarkMode(theme);

    document.documentElement.classList.toggle('dark', theme);
  }, []);

  if (isDarkMode === null) return null;

  return <>{children}</>;
};

export default ThemeProvider;
