import { Metadata } from 'next';

import HeroSection from '@/app/(main)/sections/HeroSection';
import AboutSection from '@/app/(main)/sections/AboutSection';
import FeaturedSection from '@/app/(main)/sections/FeaturedSection';
import StoryCardsSection from '@/app/(main)/sections/StoryCardsSection';
import StoryBoardSection from '@/app/(main)/sections/StoryBoardSection';
import FaqSection from '@/app/(main)/sections/FaqSection';
import BetaSection from '@/app/(main)/sections/BetaSection';

export const metadata: Metadata = {
  title: 'Another World Adventure',
  description: 'Access Another world adventure by logging in.',
};

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

      {/* Story Board 섹션 */}
      <StoryBoardSection />

      {/* FAQ 섹션 */}
      <FaqSection />

      {/* Beta Tester 섹션 */}
      <BetaSection />
    </>
  );
}
