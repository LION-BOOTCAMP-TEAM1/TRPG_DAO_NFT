'use client';

import { useParams } from 'next/navigation';
import { useScenePlayback } from '../[storySlug]/hooks/useScenePlayback';
import { useImageLoader } from '../hooks/useImageLoader';
import { useDaoContract } from './hooks/useDaoContract';
import { useChapterDetail } from '../hooks/useChapterDetail';
import { useStoryDetail } from '../[storySlug]/hooks/useStoryDetail';
import { useProposalHandler } from './hooks/useProposalHandler';

import { StoryHeader } from './components/StoryHeader';
import { SceneDisplay } from './components/SceneDisplay';
import { QuestSelector } from './components/QuestSelector';
import { BranchVoting } from './components/BranchVoting';
import { VotingResult } from './components/VotingResult';
import { toast } from 'sonner';
import { useEffect } from 'react';

const DetailClient = () => {
  const { storySlug, chapterSlug } = useParams();
  const { chapter } = useChapterDetail(chapterSlug as string);
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
    sessionId: chapter?.id ?? 1,
    onVoteEnd: () => setIsSkipping(true),
  });

  const errorToast = (err: string) => {
    toast('Proposal 생성 오류', {
      description: err,
      id: 'proposal-error',
    });
  };

  useEffect(() => {
    if (proposalError) {
      errorToast(proposalError);
    }
  }, [proposalError]);

  if (!story) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-fantasy-background text-fantasy-text">
        Loading...
      </div>
    );
  }

  return (
    <div
      className="p-6 space-y-6 min-h-screen bg-fantasy-background bg-cover bg-no-repeat bg-center"
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
    </div>
  );
};

export default DetailClient;
