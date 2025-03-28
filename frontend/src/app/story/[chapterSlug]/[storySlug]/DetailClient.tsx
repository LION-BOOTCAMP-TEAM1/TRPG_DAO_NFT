'use client';

import { useParams } from 'next/navigation';
import { useStoryDetail } from '../[storySlug]/hooks/useStoryDetail';
import { useScenePlayback } from '../[storySlug]/hooks/useScenePlayback';
import StoryRenderer from '../[storySlug]/components/StoryRenderer';
import { useImageLoader } from '../hooks/useImageLoader';

const DetailClient = () => {
  const { storySlug } = useParams(); // story/[chapterSlug]/[storySlug]

  const { story } = useStoryDetail(storySlug as string);
  const { displayedScenes, currentText, setIsSkipping, isSceneComplete } =
    useScenePlayback(story?.StoryScene ?? []);
  const storyImageSrc = useImageLoader(story?.imageUrl);

  if (!story) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f4efe1]">
        Loading...
      </div>
    );
  }

  return (
    <div
      className="p-6 space-y-6 min-h-screen bg-cover bg-no-repeat bg-center bg-[#f4efe1]"
      onClick={() => setIsSkipping(true)}
    >
      {/* 스토리 메타 정보 */}
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-[#3e2d1c]">{story.title}</h2>
        <p className="text-[#5e4b3c]">{story.summary}</p>
        {storyImageSrc && (
          <img
            src={storyImageSrc}
            alt={story.title}
            className="w-full max-w-3xl rounded-lg border border-[#d2c5ae]"
          />
        )}
      </div>

      {/* 씬 출력 */}
      <div className="text-[#3e2d1c] whitespace-pre-line space-y-4">
        {displayedScenes.map((text, i) => (
          <p key={i}>{text}</p>
        ))}
        {currentText && <p>{currentText}</p>}
      </div>

      {/* 분기점 및 퀘스트 */}
      <StoryRenderer
        isSceneComplete={isSceneComplete ?? false}
        quests={story.quests}
        branchPoints={story.BranchPoint}
      />
    </div>
  );
};

export default DetailClient;
