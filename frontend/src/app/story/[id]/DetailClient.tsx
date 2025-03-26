'use client';

import { useParams } from 'next/navigation';
import { useStoryDetail } from './hooks/useStoryDetail';
import { useStoryScenePlayback } from './hooks/useStoryScenePlayback';
import StoryRenderer from './components/StoryRenderer';

const DetailClient = () => {
  const { id } = useParams();
  const { story, quests } = useStoryDetail(id as string);
  const { displayedScenes, currentText, setIsSkipping, isSceneComplete } =
    useStoryScenePlayback(story);

  if (!story)
    return (
      <div className="flex items-center justify-center bg-[#f4efe1] min-h-screen">
        Loading...
      </div>
    );

  return (
    <div
      className="p-6 space-y-6 min-h-screen bg-cover bg-no-repeat bg-center bg-[#f4efe1]"
      onClick={() => setIsSkipping(true)}
    >
      <h1 className="text-2xl font-bold text-[#3e2d1c] drop-shadow-md">
        {story.title}
      </h1>
      <p className="text-[#3e2d1c] drop-shadow-sm">{story.summary}</p>

      <div className="text-[#3e2d1c] whitespace-pre-line space-y-4">
        {displayedScenes.map((text, i) => (
          <p key={i}>{text}</p>
        ))}
        {currentText && <p>{currentText}</p>}
      </div>

      <StoryRenderer
        isSceneComplete={isSceneComplete ?? false}
        quests={quests}
        branchPoints={story.BranchPoint}
      />
    </div>
  );
};

export default DetailClient;
