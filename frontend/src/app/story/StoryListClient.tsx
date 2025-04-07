'use client';

import api from '@/lib/axios';
import { useEffect, useState } from 'react';
import FeatureSection from './components/FeatureSection';
import StoryCard from './components/StoryCard';
import { StorySummary } from './types/story';
import useAuth from '../hook/useAuth';
import Image from 'next/image';
import FantasyButton from '../components/FantasyButton';
import axios from 'axios';

const StoryListPage = () => {
  const [branchpoints, setBranchpoints] = useState<StorySummary[]>([]);

  useEffect(() => {
    api
      .get('/api/branchpoints')
      .then((response) => setBranchpoints(response.data))
      .catch((error) => console.error('Error fetching data:', error));
  }, []);

  return (
    <div className="mt-24 bg-fantasy-background">
      {/* 표지 - Enhanced Cover Design */}
      <div className="relative flex justify-center items-center mb-16">
        {/* Background decorative elements */}
        <div className="absolute inset-0 bg-gradient-to-b from-fantasy-magic/10 to-fantasy-background/0 rounded-3xl mx-4 sm:mx-12"></div>

        {/* Main cover container with border effect */}
        <div className="relative w-full max-w-5xl overflow-hidden">
          {/* Decorative top border */}
          <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-fantasy-bronze/20 via-fantasy-gold to-fantasy-bronze/20 z-10"></div>

          {/* Cover image with overlay */}
          <div className="relative">
            <Image
              src={`/story/story3.png`}
              alt={'소환된 영혼들의 연대기'}
              width={1600}
              height={700}
              className="object-cover w-full h-[600px] rounded-2xl shadow-[0_0_15px_rgba(166,124,82,0.4)] border-2 border-fantasy-copper"
            />
            {/* Subtle image overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-fantasy-shadow/60 to-transparent rounded-2xl"></div>
          </div>

          {/* Title and tagline container */}
          <div className="absolute bottom-0 left-0 w-full p-8 sm:p-12 text-center sm:text-right">
            <div className="inline-block relative">
              {/* Decorative line */}
              <div className="hidden sm:block absolute -left-12 top-1/2 w-10 h-[3px] bg-fantasy-gold transform -translate-y-1/2"></div>

              <h1 className="font-continuous text-4xl sm:text-5xl lg:text-6xl text-white font-bold mb-2 drop-shadow-[0_2px_5px_rgba(0,0,0,0.9)]">
                소환된 영혼들의 연대기
              </h1>

              <p className="text-xl text-white font-semibold mb-6 drop-shadow-[0_2px_2px_rgba(0,0,0,0.6)]">
                Decide the fate. Mint the Story.
              </p>

              {/* Using FantasyButton component */}
              <div className="mt-4">
                <FantasyButton href="/pages/login" size="lg">
                  모험 시작하기
                </FantasyButton>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content section */}
      <div className="flex flex-col mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pb-24">
        {/* 특징 */}
        <div className="mb-16">
          <FeatureSection />
        </div>

        {/* Story List */}
        <div className="space-y-8">
          <h1 className="font-continuous text-3xl text-fantasy-text font-bold mb-6 relative inline-block">
            <span>Stories</span>
            <span className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-fantasy-gold to-transparent"></span>
          </h1>

          {branchpoints.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-fantasy-copper/30 rounded-lg bg-fantasy-surface/50">
              <p className="text-fantasy-text/60 italic">Loading stories...</p>
            </div>
          ) : (
            branchpoints.map((bp) => <StoryCard key={bp.slug} story={bp} />)
          )}
        </div>
      </div>
    </div>
  );
};

export default StoryListPage;
