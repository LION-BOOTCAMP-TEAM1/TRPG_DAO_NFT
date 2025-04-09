'use client';

import { ReactNode, createContext, useContext } from 'react';
import { ReduxProvider } from '../../store/provider';
import { AuthContext } from './AuthProvider';
import useAuth from '../hooks/useAuth';
import { ThemeContext } from '../components/ThemeProvider';
import { useState, useEffect } from 'react';
import { Toaster } from 'sonner';
import { AudioProvider } from '../contexts/AudioContext';

// Auth 컨텍스트 타입
type AuthContextType = ReturnType<typeof useAuth>;

// 테마 컨텍스트 타입
type ThemeContextType = {
  isDarkMode: boolean;
  toggleTheme: () => void;
};

// 컨텍스트를 사용하기 위한 훅 함수들
export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AppProvider');
  }
  return context;
};

export const useThemeContext = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeContext must be used within an AppProvider');
  }
  return context;
};

// 모든 Provider를 통합하는 AppProvider 컴포넌트
export default function AppProvider({ children }: { children: ReactNode }) {
  // Auth 관련 상태 및 함수
  const auth = useAuth();

  // Theme 관련 상태 및 함수
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [isThemeLoaded, setIsThemeLoaded] = useState<boolean>(false);

  // 초기화 시 로컬스토리지에서 테마 불러오기
  useEffect(() => {
    // 클라이언트 환경에서만 실행
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      // 저장된 테마가 없으면 시스템 테마 사용 (옵션)
      const prefersDark =
        savedTheme === 'dark' ||
        (savedTheme === null &&
          window.matchMedia('(prefers-color-scheme: dark)').matches);

      setIsDarkMode(prefersDark);

      // 다크 모드 적용
      if (prefersDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }

      setIsThemeLoaded(true);
    }
  }, []);

  // 테마 토글 함수
  const toggleTheme = (): void => {
    setIsDarkMode((prev) => {
      const newTheme = !prev;
      localStorage.setItem('theme', newTheme ? 'dark' : 'light');

      if (newTheme) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }

      return newTheme;
    });
  };

  return (
    <AuthContext.Provider value={auth}>
      <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
        <AudioProvider>
          {children}
          <Toaster richColors position="top-right" />
        </AudioProvider>
      </ThemeContext.Provider>
    </AuthContext.Provider>
  );
}
