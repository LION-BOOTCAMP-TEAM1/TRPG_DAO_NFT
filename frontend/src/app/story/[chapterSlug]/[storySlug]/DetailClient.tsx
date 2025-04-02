'use client';

import { useParams } from 'next/navigation';
import { useScenePlayback } from '../[storySlug]/hooks/useScenePlayback';
import { useImageLoader } from '../hooks/useImageLoader';
import { useDaoContract } from '../../[chapterSlug]/hooks/useDaoContract';
import { useStoryDetail } from '../[storySlug]/hooks/useStoryDetail';
import { useProposalHandler } from './hooks/useProposalHandler';

import { StoryHeader } from './components/StoryHeader';
import { SceneDisplay } from './components/SceneDisplay';
import { QuestSelector } from './components/QuestSelector';
import { BranchVoting } from './components/BranchVoting';
import { VotingResult } from './components/VotingResult';

const DetailClient = () => {
  const { storySlug, chapterSlug } = useParams();
  const { story } = useStoryDetail(storySlug as string);
  const { displayedScenes, currentText, setIsSkipping, isSceneComplete } =
    useScenePlayback(story?.StoryScene ?? []);
  const storyImageSrc = useImageLoader(story?.imageUrl);
  const dao = useDaoContract();

  const {
    proposalId,
    proposalError,
    voteResults,
    totalVoters,
    totalVotes,
    voteEnded,
    winningChoice,
    isVoting,
    voteStatus,
    voteError,
    handleVote,
  } = useProposalHandler({
    dao,
    branchPoint: story?.BranchPoint?.[0],
    sessionId: 1,
    onVoteEnd: () => setIsSkipping(true),
  });

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
      <StoryHeader story={story} imageSrc={storyImageSrc} />

      <SceneDisplay
        displayedScenes={displayedScenes}
        currentText={currentText}
      />

      {isSceneComplete && story?.quests?.length > 0 && (
        <QuestSelector story={story} chapterSlug={chapterSlug as string} />
      )}

      {story?.BranchPoint?.[0] &&
        proposalId !== null &&
        isSceneComplete &&
        !voteEnded && (
          <BranchVoting
            branchPoint={story.BranchPoint[0]}
            voteResults={voteResults}
            totalVotes={totalVotes}
            totalVoters={totalVoters}
            isVoting={isVoting}
            voteStatus={voteStatus}
            voteError={voteError}
            handleVote={handleVote}
          />
        )}

      {voteEnded &&
        winningChoice &&
        isSceneComplete &&
        story?.BranchPoint?.[0] && (
          <VotingResult
            branchPoint={story.BranchPoint[0]}
            voteResults={voteResults}
            totalVotes={totalVotes}
            totalVoters={totalVoters}
            winningChoice={winningChoice}
            chapterSlug={chapterSlug as string}
          />
        )}

      {proposalError && (
        <p className="text-red-600 mt-4">❌ 오류: {proposalError}</p>
      )}
    </div>
  );
};

export default DetailClient;
