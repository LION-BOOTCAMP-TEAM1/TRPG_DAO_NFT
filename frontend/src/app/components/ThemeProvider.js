import { useEffect, useState } from 'react';

const ThemeProvider = ({ children }) => {
  // ✅ 초기 상태는 `null`로 설정하고, 클라이언트에서만 값을 불러오기
  const [isDarkMode, setIsDarkMode] = useState(null);

  useEffect(() => {
    // ✅ 클라이언트 환경에서만 실행
    const theme = localStorage.getItem('theme') === 'dark';
    setIsDarkMode(theme);

    // ✅ 다크 모드 적용
    document.documentElement.classList.toggle('dark', theme);
  }, []);

  // ✅ 상태가 `null`일 때는 아무것도 렌더링하지 않음 (서버에서 에러 방지)
  if (isDarkMode === null) return null;

  return <>{children}</>;
};

export default ThemeProvider;
