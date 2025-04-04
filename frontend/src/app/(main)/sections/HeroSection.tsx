'use client';

import Link from 'next/link';
import { useThemeContext } from '@/app/providers/AppProvider';

interface HeroSectionProps {
  title: string;
  subtitle: string;
  ctaButtonText: string;
  ctaButtonLink: string;
  backgroundImage: string;
}

export default function HeroSection({
  title = "Decide the Fate, Mint the Story.",
  subtitle = "판타지 세계를 누비며 전설의 퀘스트를 시작하세요",
  ctaButtonText = "지금 시작하기",
  ctaButtonLink = "/story",
  backgroundImage = "/main/hero-banner.png"
}: Partial<HeroSectionProps>) {
  const { isDarkMode } = useThemeContext();
  
  return (
    <div className="relative h-screen flex items-center justify-center overflow-hidden">
      {/* 배경 이미지 */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0" 
        style={{ 
          backgroundImage: `url(${backgroundImage})`,
          filter: isDarkMode ? 'brightness(0.6)' : 'brightness(0.8)'
        }}
      />
      
      {/* 내용 */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-fantasy-gold dark:text-[var(--fantasy-gold)] mb-4 tracking-wide">
          {title}
        </h1>
        <p className="text-xl md:text-2xl text-white dark:text-[var(--fantasy-text)] mb-8 max-w-3xl mx-auto">
          {subtitle}
        </p>
        <Link href={ctaButtonLink}>
          <button className="px-8 py-3 bg-fantasy-blood hover:bg-red-800 dark:bg-[var(--fantasy-blood)] dark:hover:opacity-90 text-white dark:text-white font-bold rounded-lg transition-all transform hover:scale-105 shadow-lg">
            {ctaButtonText}
          </button>
        </Link>
      </div>

      {/* 아래로 스크롤 버튼 (선택 사항) */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <svg className="w-6 h-6 text-white dark:text-[var(--fantasy-text)]" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
          <path d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
        </svg>
      </div>
    </div>
  );
} 