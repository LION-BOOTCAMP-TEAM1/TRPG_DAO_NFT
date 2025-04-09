'use client';

import { useEffect, useState } from 'react';
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
import BattleHandler from './components/BattleHandler';
import EndStoryButton from './components/EndStoryButton';
import TransactionLoadingModal from './components/TransactionLoadingModal';

const DetailClient = () => {
  const { storySlug, chapterSlug } = useParams();
  const { chapter } = useChapterDetail(chapterSlug as string);
  const { story } = useStoryDetail(storySlug as string);
  const { dao, signer } = useDaoContract();
  const [walletAddress, setWalletAddress] = useState('');
  
  // 트랜잭션 상태 관리
  const [transactionStatus, setTransactionStatus] = useState({
    isLoading: false,
    message: '',
  });
  
  // 로딩 모달 닫기에 딜레이를 주기 위한 상태
  const [shouldDisplayModal, setShouldDisplayModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  const { displayedScenes, currentText, setIsSkipping, isSceneComplete } =
    useScenePlayback(story?.StoryScene ?? []);

  const storyImageSrc = useImageLoader(story?.imageUrl);

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
    isInitializingProposal,
    isClosingProposal,
  } = useProposalHandler({
    dao,
    branchPoint: story?.BranchPoint?.[0],
    sessionId: chapter?.id ?? 1,
    onVoteEnd: () => setIsSkipping(true),
    onVoteStart: () => setTransactionStatus({
      isLoading: true,
      message: '당신의 결정이 세계의 운명을 바꾸고 있습니다...',
    }),
    onVoteComplete: () => setTransactionStatus({
      isLoading: false,
      message: '',
    }),
    onProposalInitStart: () => setTransactionStatus({
      isLoading: true,
      message: '세계의 분기점이 준비되고 있습니다...',
    }),
    onProposalInitComplete: () => setTransactionStatus({
      isLoading: false,
      message: '',
    }),
    onProposalCloseStart: () => setTransactionStatus({
      isLoading: true,
      message: '분기점이 닫히고 새로운 운명이 결정됩니다...',
    }),
    onProposalCloseComplete: () => setTransactionStatus({
      isLoading: false, 
      message: '',
    }),
  });

  // 모든 로딩 상태를 관찰하여 통합된 로딩 상태를 설정
  useEffect(() => {
    const isAnyTransactionInProgress = isInitializingProposal || isVoting || isClosingProposal;
    
    if (isAnyTransactionInProgress) {
      let message = '마법이 시전되는 중입니다...';
      
      if (isInitializingProposal) {
        message = '세계의 분기점이 준비되고 있습니다...';
      } else if (isVoting) {
        message = '당신의 결정이 세계의 운명을 바꾸고 있습니다...';
      } else if (isClosingProposal) {
        message = '분기점이 닫히고 새로운 운명이 결정됩니다...';
      }
      
      setModalMessage(message);
      setShouldDisplayModal(true);
    } else {
      // 트랜잭션이 완료되면 2초 후에 모달을 닫기 (시각적 안정감)
      if (shouldDisplayModal) {
        const timer = setTimeout(() => {
          setShouldDisplayModal(false);
        }, 2000); // 2초 딜레이
        
        return () => clearTimeout(timer);
      }
    }
  }, [isInitializingProposal, isVoting, isClosingProposal, shouldDisplayModal]);

  // transactionStatus 상태도 함께 관리
  useEffect(() => {
    setTransactionStatus(prev => ({
      ...prev,
      isLoading: shouldDisplayModal
    }));
  }, [shouldDisplayModal]);

  useEffect(() => {
    const loadAddress = async () => {
      if (signer) {
        const address = await signer.getAddress();
        setWalletAddress(address);
      }
    };
    loadAddress();
  }, [signer]);

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

      {isSceneComplete &&
        (storySlug == 'ruins-awakening' || story?.id == 14) && (
          <BattleHandler
            isSceneComplete={isSceneComplete}
            story={story}
            chapterSlug={chapterSlug as string}
          />
        )}

      {isSceneComplete &&
        (storySlug == 'ancient-power-revealed' || story?.id == 15) && (
          <EndStoryButton walletAddress={walletAddress} />
        )}
        
      {/* 트랜잭션 로딩 모달 */}
      <TransactionLoadingModal 
        isOpen={shouldDisplayModal} 
        message={modalMessage || '마법이 시전되는 중입니다...'}
      />
    </div>
  );
};

export default DetailClient;
