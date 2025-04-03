/** @type {import('tailwindcss').Config} */
// tailwind.config.js
module.exports = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
    './src/pages/**/*.{js,ts,jsx,tsx}',
    './src/styles/**/*.{css,scss}',
    './src/**/*.{js,ts,jsx,tsx}'
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // 기본 팔레트 (라이트모드에서 사용)
        fantasy: {
          background: '#f9f5ed',   // 양피지 배경
          surface: '#ede2cb',      // 표면 배경
          bronze: '#a67c52',       // 청동
          gold: '#ffd700',         // 황금색
          copper: '#e6be8a',       // 구리색
          text: '#3e2723',         // 주요 텍스트
          blood: '#c62828',        // 레드
          magic: '#673ab7',        // 보라
          leather: '#8d6e63',      // 가죽색
          iron: '#9e9e9e',         // 철 색상
          forest: '#388e3c',       // 숲 색상
        },
      },
      // 그라데이션
      backgroundImage: {
        'castle': 'linear-gradient(to bottom, #f5f5f5, #e0e0e0)',
        'magic': 'linear-gradient(to bottom right, #d1c4e9, #e8eaf6, #f5f5f5)',
      },
    },
  },
  plugins: [],
};
