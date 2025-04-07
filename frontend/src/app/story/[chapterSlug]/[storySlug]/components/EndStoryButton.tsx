'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

const EndStoryButton = () => {
  const router = useRouter();

  const handleClick = () => {
    console.log('📘 스토리 종료 처리!');
    router.push('/story');
  };

  return (
    <button
      onClick={handleClick}
      className="px-6 py-3 bg-gray-800 text-white font-bold rounded-lg hover:bg-gray-700 transition"
    >
      📘 스토리 종료하기
    </button>
  );
};

export default EndStoryButton;
