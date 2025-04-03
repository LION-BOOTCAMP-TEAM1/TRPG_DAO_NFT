'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

// 테마 컨텍스트 타입 정의
type ThemeContextType = {
  isDarkMode: boolean;
  toggleTheme: () => void;
};

// 테마 컨텍스트 생성
export const ThemeContext = createContext<ThemeContextType>({
  isDarkMode: false,
  toggleTheme: () => {},
});

// 테마 컨텍스트 훅 생성
export const useTheme = (): ThemeContextType => useContext(ThemeContext);

// 프로바이더 프롭스 타입 정의
interface ThemeProviderProps {
  children: ReactNode;
}

const ThemeProvider = ({ children }: ThemeProviderProps): ReactNode | null => {
  // 초기 상태는 `null`로 설정하고, 클라이언트에서만 값을 불러오기
  const [isDarkMode, setIsDarkMode] = useState<boolean | null>(null);

  // 초기화 시 로컬스토리지에서 테마 불러오기
  useEffect(() => {
    // 클라이언트 환경에서만 실행
    const savedTheme = localStorage.getItem('theme');
    // 저장된 테마가 없으면 시스템 테마 사용 (옵션)
    const prefersDark = savedTheme === 'dark' || 
      (savedTheme === null && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    setIsDarkMode(prefersDark);
    
    // 다크 모드 적용 - classList.toggle 대신 명시적 추가/제거
    if (prefersDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // 디버그용 콘솔 로그
    console.log('Theme initialized:', prefersDark ? 'dark' : 'light');
    console.log('Dark class present:', document.documentElement.classList.contains('dark'));
  }, []);

  // 테마 토글 함수
  const toggleTheme = (): void => {
    setIsDarkMode((prev) => {
      const newTheme = !prev;
      localStorage.setItem('theme', newTheme ? 'dark' : 'light');
      
      // classList.toggle 대신 명시적 추가/제거로 변경
      if (newTheme) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      
      // 디버그용 콘솔 로그
      console.log('Theme toggled to:', newTheme ? 'dark' : 'light');
      console.log('Dark class present after toggle:', document.documentElement.classList.contains('dark'));
      
      return newTheme;
    });
  };

  // 상태가 `null`일 때는 아무것도 렌더링하지 않음 (서버에서 에러 방지)
  if (isDarkMode === null) return null;

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;
