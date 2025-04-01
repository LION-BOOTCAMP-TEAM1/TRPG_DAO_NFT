'use client';

import { useEffect, useState } from 'react';
import FeatureSection from './components/FeatureSection';
import StoryCard from './components/StoryCard';
import { StorySummary } from './types/story';
import Header from '../components/Header';
import useWallet from '../hook/useWallet';
import ThemeProvider from '../components/ThemeProvider';
import Image from 'next/image';
import Link from 'next/link';

const StoryListPage = () => {
  const [branchpoints, setBranchpoints] = useState<StorySummary[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const {
    connectWallet,
    registerWalletAddress,
    disconnect,
    signer,
    walletExist,
  } = useWallet();

  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  useEffect(() => {
    fetch('http://localhost:5001/api/branchpoints')
      .then((res) => res.json())
      .then((data) => setBranchpoints(data))
      .catch((error) => console.error('Error fetching data:', error));
  }, []);

  return (
    /*다크 모드 */
    <ThemeProvider>
      <div className="p-6 space-y-12 min-h-screen ">
        {/* 헤더 프롭스 */}
        <Header
          onToggle={toggleTheme}
          isDarkMode={isDarkMode}
          connectWallet={connectWallet}
          registerWalletAddress={registerWalletAddress}
          disconnect={disconnect}
          walletExist={walletExist}
          signer={signer}
        />

        {/* 표지 */}
        <div className="z-0 flex flex-col justify-center items-center">
          <Image
            src={`/story/story3.png`}
            alt={'cover'}
            width={1600}
            height={600}
            className="object-cover w-full sm:w-[1100px] h-[700px] shadow border  border-[#d2c5ae] rounded-2xl"
          />
          <div
            className="flex flex-col absolute z-10 font-bold text-5xl text-white  border:text-black drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,1)]
           sm:top-[750px] sm:right-[50px] sm:translate-x-0 sm:translate-y-0 
    md:top-[700px] md:right-[50px] md:translate-x-0 md:translate-y-0 
    lg:top-[700px] lg:right-[400px] lg:translate-x-0 lg:translate-y-0"
          >
            <p> `소환된 영혼들의 연대기`</p>
            <div>
              <p className="text-xl absolute right-30">
                Decide the fate. Mint the Story.
              </p>
            </div>
            <div className="absolute top-[90px] right-[200px] text-xl  px-4 py-1 rounded hover:bg-[#374fc9] transition-colors inline-block bg-[#1e40af] cursor-pointer ">
              <Link href={'/pages/login'}>모험 시작하기</Link>
            </div>
          </div>
        </div>
        <div className="flex flex-col m-20 mx-auto w-300 p-4 rounded-lg shadow-lg font-bold h-screen">
          {/* 특징 */}
          <FeatureSection />

          {/* Story List */}
          <div className="space-y-6">
            <h1 className="story-list-h2">Stories</h1>

            {branchpoints.map((bp) => (
              <StoryCard key={bp.slug} story={bp} />
            ))}
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
};

export default StoryListPage;
