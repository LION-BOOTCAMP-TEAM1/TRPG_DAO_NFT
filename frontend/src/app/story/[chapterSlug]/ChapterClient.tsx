// app/story/[chapterSlug]/ChapterClient.tsx

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { useChapterDetail } from './hooks/useChapterDetail';
import { useImageLoader } from './hooks/useImageLoader';
import { useSession } from './hooks/useSession';
import { useCurrentUser } from './hooks/useCurrentUser';
import FantasyButton from '../../components/FantasyButton';
import { saveAllowedChapterPath } from '@/utils/manageLocalStorage';

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

    const path = `/story/${chapter.slug}/${chapter.story.slug}`;
    await saveAllowedChapterPath(path);
    router.push(path);
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
      <div className="flex items-center justify-center min-h-screen bg-fantasy-bronze dark:bg-fantasy-background">
        Loading chapter...
      </div>
    );
  }

  return (
    <div className="p-6 min-h-screen space-y-6 mt-12 bg-fantasy-bronze dark:bg-fantasy-background text-fantasy-text">
      <div className="pl-6">
        <h1 className="text-2xl font-bold text-fantasy-text">
          {chapter.title}
        </h1>
        <p className="text-fantasy-text/80 mb-4">{chapter.description}</p>

        {imageSrc && (
          <div className="w-full max-w-3xl mx-auto">
            <Image
              src={imageSrc}
              alt={chapter.title}
              width={800}
              height={450}
              className="rounded shadow-md object-cover w-full h-auto border border-fantasy-copper"
            />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <FantasyButton
          onClick={handleStartStory}
          variant="primary"
          size="lg"
          className={isJoining ? 'opacity-50 cursor-not-allowed' : ''}
        >
          👉 스토리 시작하기
        </FantasyButton>
      </div>
    </div>
  );
}
