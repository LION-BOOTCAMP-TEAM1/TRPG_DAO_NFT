'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function StartClient() {
  const [getChapters, setGetChapter] = useState<any[]>([]);

  const getChapter = async () => {
    try {
      const response = await fetch(
        'https://trpg-dao-nft.onrender.com/api/chapters',
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        },
      );

      if (response.ok) {
        const data = await response.json();
        setGetChapter(data); // 가져온 데이터를 상태에 저장
      } else {
        console.error('Error fetching chapters:', response.status);
      }
    } catch (error) {
      console.error('Error fetching chapters:', error);
    }
  };

  useEffect(() => {
    getChapter(); // 페이지 로드 시 챕터 데이터 가져오기
  }, []);

  return (
    <div className="flex flex-col items-center min-h-screen bg-[#f4efe1]">
      <div
        className="text-6xl py-10 drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,1)]"
        style={{ fontFamily: 'continuous' }}
      >
        <h1>Ongoing Adventureasd</h1>
      </div>

      {/* 진행중인 챕터 리스트 */}
      <div className="flex flex-col items-center">
        {getChapters.length > 0 ? (
          getChapters.map((chapter: any) => (
            <div
              key={chapter.id}
              className="my-4 p-4 bg-white shadow-md rounded-md w-80"
            >
              <h2 className="text-2xl">{chapter.story.title}</h2>
              <p className="text-sm text-gray-500">Slug: {chapter.slug}</p>
              <p className="text-md">Sequence: {chapter.sequence}</p>
            </div>
          ))
        ) : (
          <p>Loading chapters...</p>
        )}
      </div>

      {/* 캐릭터 생성 페이지 */}
      <div
        className="text-2xl py-2 drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,1)]"
        style={{ fontFamily: 'continuous' }}
      >
        <h1>New Adventureasd</h1>
      </div>
      <div>
        <Link
          href={'/create'}
          className="inline-block bg-[#1e40af] text-white text-sm px-4 py-1 rounded hover:bg-[#374fc9] transition-colors"
        >
          생성하기
        </Link>
      </div>
    </div>
  );
}
