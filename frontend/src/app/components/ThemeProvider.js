import { useEffect } from 'react';

const ThemeProvider = ({ children }) => {
  const isDarkMode = localStorage.getItem('theme') === 'dark';

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  return <>{children}</>;
};

export default ThemeProvider;
