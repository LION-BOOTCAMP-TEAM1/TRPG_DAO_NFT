// app/story/[chapterSlug]/ChapterClient.tsx

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { useChapterDetail } from './hooks/useChapterDetail';
import { useImageLoader } from './hooks/useImageLoader';
import { useSession } from './hooks/useSession';
import { useCurrentUser } from './hooks/useCurrentUser';

export default function ChapterClient() {
  const router = useRouter();
  const { chapterSlug } = useParams();

  const { chapter } = useChapterDetail(chapterSlug as string);
  const { session, loading, fetchSession, joinSession } = useSession(
    chapterSlug as string,
  );
  const { currentUser, fetchAndSetCurrentUser } = useCurrentUser();
  const [isJoining, setIsJoining] = useState(false);

  const imageSrc = useImageLoader(chapter?.imageUrl);

  const handleStartStory = async () => {
    if (!currentUser || !session || !chapter) return;
    console.log('[handleStartStory] clicked with user:', currentUser);

    const alreadyJoined = session.participants.some(
      (p) => p.userId === currentUser.id,
    );
    if (!alreadyJoined) {
      setIsJoining(true);
      await joinSession(currentUser.id);
      await fetchSession();
      setIsJoining(false);
    }

    router.push(`/story/${chapter.slug}/${chapter.story.slug}`);
  };

  useEffect(() => {
    if (chapterSlug) {
      console.log('[useEffect] chapterSlug ready:', chapterSlug);
      fetchSession();
      fetchAndSetCurrentUser();
    }
  }, [chapterSlug]);

  if (loading || !session || !chapter) {
    console.log('[render] Still loading...', { loading, session, chapter });
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
          disabled={isJoining}
          className="inline-block px-4 py-2 mt-4 bg-[#1e40af] text-white rounded hover:bg-[#374fc9] transition-colors disabled:opacity-50"
        >
          👉 스토리 시작하기
        </button>
      </div>
    </div>
  );
}
