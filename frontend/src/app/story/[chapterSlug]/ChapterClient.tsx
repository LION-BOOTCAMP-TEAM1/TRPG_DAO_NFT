'use client';

import { useParams } from 'next/navigation';
import { useChapterDetail } from './hooks/useChapterDetail';
import Link from 'next/link';
import Image from 'next/image';
import { useImageLoader } from './hooks/useImageLoader';

const ChapterClient = () => {
  const { chapterSlug } = useParams();
  const { chapter } = useChapterDetail(chapterSlug as string);
  const imageSrc = useImageLoader(chapter?.imageUrl);

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

      <div>
        <Link
          href={`/story/${chapter.slug}/${chapter.story.slug}`}
          className="inline-block px-4 py-2 mt-4 bg-[#1e40af] text-white rounded hover:bg-[#374fc9] transition-colors"
        >
          👉 스토리 시작하기
        </Link>
      </div>
    </div>
  );
};

export default ChapterClient;
