'use client';

import HeroSection from '../../components/main/HeroSection';
import AboutSection from '../../components/main/AboutSection';
import FeaturedSection from '../../components/main/FeaturedSection';
import StoryCardsSection from '../../components/main/StoryCardsSection';
import FaqSection from '../../components/main/FaqSection';
import BetaSection from '../../components/main/BetaSection';

export default function HomePage() {
  return (
    <>
      {/* 메인 히어로 배너 */}
      <HeroSection />

      {/* About Us 섹션 */}
      <AboutSection />

      {/* Featured 섹션 */}
      <FeaturedSection />

      {/* Story Cards 섹션 */}
      <StoryCardsSection />

      {/* FAQ 섹션 */}
      <FaqSection />

      {/* Beta Tester 섹션 */}
      <BetaSection />
    </>
  );
}
