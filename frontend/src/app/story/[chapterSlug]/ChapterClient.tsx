'use client';

import { useParams } from 'next/navigation';
import { useDaoContract } from './hooks/useDaoContract';
import { useChapterDetail } from './hooks/useChapterDetail';
import Image from 'next/image';
import { useImageLoader } from './hooks/useImageLoader';
import { useEffect } from 'react';
import { useCreateSession } from './hooks/useCreateSession';
import { useJoinSession } from './hooks/useJoinSession';

const ChapterClient = () => {
  const { chapterSlug } = useParams();
  const { chapter } = useChapterDetail(chapterSlug as string);
  const dao = useDaoContract();
  const imageSrc = useImageLoader(chapter?.imageUrl);

  // 세션 생성 및 참가 훅
  const { createSession, txHash, error } = useCreateSession();
  const { joinSession, joinTx, joinError } = useJoinSession();

  const dummyChapter = {
    id: 1,
    worldId: 1,
    genreId: 1,
    slug: chapter?.slug || 'chapter-1-awakening',
    storySlug: chapter?.story?.slug || 'isekai-summoning',
  };
  useEffect(() => {
    if (chapter && dao) {
      createSession(dummyChapter, dao);
    }
  }, [chapter, dao]);

  const handleStartStory = () => {
    if (dao) joinSession(dummyChapter, dao);
  };

  if (!chapter) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f4efe1]">
        Loading chapter...
      </div>
    );
  }

  return (
    <div className="p-6 min-h-screen bg-[#f4efe1] space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#3e2d1c]">{chapter.title}</h1>
        <p className="text-[#5e4b3c] mb-4">{chapter.description}</p>

        {imageSrc && (
          <div className="w-full max-w-3xl mx-auto">
            <Image
              src={imageSrc}
              alt={chapter.title}
              width={800}
              height={450}
              className="rounded shadow-md object-cover w-full h-auto"
            />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <button
          onClick={handleStartStory}
          className="inline-block px-4 py-2 mt-4 bg-[#1e40af] text-white rounded hover:bg-[#374fc9] transition-colors"
        >
          👉 스토리 시작하기
        </button>

        {txHash && (
          <p className="mt-2 text-green-600">세션 생성 완료! Tx: {txHash}</p>
        )}
        {joinTx && (
          <p className="mt-2 text-green-600">세션 참가 완료! Tx: {joinTx}</p>
        )}
        {error && <p className="mt-2 text-red-600">세션 생성 오류: {error}</p>}
        {joinError && (
          <p className="mt-2 text-red-600">세션 참가 오류: {joinError}</p>
        )}
      </div>
    </div>
  );
};

export default ChapterClient;
