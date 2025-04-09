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
import GlobalAudioPlayer from '@/app/components/GlobalAudioPlayer';
import { useAudio } from '@/app/contexts/AudioContext';

import { loadLocalStorage } from '@/store/characterSlice';
import { AppDispatch } from "@/store";
import { useDispatch } from "react-redux";

import {saveStoryToLocalStorage} from "@/utils/manageLocalStorage";

const DetailClient = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { storySlug, chapterSlug } = useParams();
  const { chapter } = useChapterDetail(chapterSlug as string);
  const { story } = useStoryDetail(storySlug as string);
  const { dao, signer } = useDaoContract();
  const [walletAddress, setWalletAddress] = useState('');
  
  // 오디오 컨텍스트 훅
  const { play } = useAudio();
  
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

    
    dispatch(loadLocalStorage());
    saveStoryToLocalStorage(`story/${chapterSlug}/${storySlug}`);
    loadAddress();
  }, [signer]);

  // URL 및 씬에 따른 오디오 소스 결정 및 재생
  useEffect(() => {
    if (!story) return;
    
    let audioSrc = '/music/intro.mp3';
    
    // 특정 URL에 따른 음악 설정
    if (chapterSlug === 'chapter-1-awakening') {
      // URL의 숫자에 따라 다른 음악 재생
      if (storySlug === '1') {
        audioSrc = '/music/scene2.mp3';
      } else if (storySlug === '2' || storySlug === '3' || storySlug === 'isekai-summoning') {
        audioSrc = '/music/intro.mp3';
      } else if (storySlug === '4' || storySlug === '5' || storySlug === '6') {
        audioSrc = '/music/scene1.mp3';
      } else if (storySlug === '15') {
        // 15번 스토리에서는 다시 intro.mp3 재생
        audioSrc = '/music/intro.mp3';
      } else if (parseInt(storySlug as string) >= 13) {
        // 13번 이상의 스토리에서는 battle.mp3 재생 (15번 제외)
        audioSrc = '/music/battle.mp3';
      } else if (parseInt(storySlug as string) >= 7) {
        // 7-12번 스토리에서는 scene2.mp3 재생
        audioSrc = '/music/scene2.mp3';
      }
    } else if (displayedScenes && displayedScenes.length > 0) {
      // 현재 표시된 씬에 따라 오디오 결정
      if (displayedScenes.length <= 1) {
        audioSrc = '/music/intro.mp3';
      } else if (displayedScenes.length <= 3) {
        audioSrc = '/music/scene1.mp3';
      } else {
        audioSrc = '/music/scene2.mp3';
      }
      
      // 특정 스토리에서 전투 음악 재생
      if ((storySlug == 'ruins-awakening' || story?.id == 14) && isSceneComplete) {
        audioSrc = '/music/battle.mp3';
      }
    }
    
    // AudioContext의 play 메서드로 오디오 재생
    play(audioSrc);
    
  }, [displayedScenes, isSceneComplete, story, storySlug, chapterSlug, play]);

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
      
      {/* 글로벌 오디오 플레이어 */}
      <div className="fixed bottom-5 right-5 z-50">
        <GlobalAudioPlayer />
      </div>

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