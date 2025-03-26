// components/ThemeProvider.js
import { useEffect } from 'react';

const ThemeProvider = ({ children, isDarkMode }) => {
  useEffect(() => {
    // 다크 모드가 true일 때 'dark' 클래스를 추가
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    // 다크 모드가 변경될 때마다 로컬 스토리지에 저장
    if (isDarkMode) {
      localStorage.setItem('theme', 'dark');
      document.documentElement.classList.add('dark');
    } else {
      localStorage.setItem('theme', 'light');
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  return <>{children}</>;
};

export default ThemeProvider;
