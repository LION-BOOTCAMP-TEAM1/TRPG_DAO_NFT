import { useEffect, useState, useRef } from 'react';
import type { DAOChoice } from '../types/story';
import { EventLog } from 'ethers';
import api from '@/lib/axios';

interface UseProposalHandlerProps {
  dao: any;
  branchPoint: any;
  sessionId: number;
  onVoteEnd?: () => void;
  onVoteStart?: () => void;
  onVoteComplete?: () => void;
  onProposalInitStart?: () => void;
  onProposalInitComplete?: () => void;
  onProposalCloseStart?: () => void;
  onProposalCloseComplete?: () => void;
}

interface Participant {
  userId: number;
  walletAddress: string;
}

export function useProposalHandler({
  dao,
  branchPoint,
  sessionId,
  onVoteEnd,
  onVoteStart,
  onVoteComplete,
  onProposalInitStart,
  onProposalInitComplete,
  onProposalCloseStart,
  onProposalCloseComplete,
}: UseProposalHandlerProps) {
  const [proposalId, setProposalId] = useState<number | null>(null);
  const [proposalCreated, setProposalCreated] = useState(false);
  const [proposalChecked, setProposalChecked] = useState(false);
  const [proposalError, setProposalError] = useState('');
  
  // 로딩 상태 변수 추가
  const [isInitializingProposal, setIsInitializingProposal] = useState(false);
  const [isClosingProposal, setIsClosingProposal] = useState(false);
  
  // 폴링 관련 변수
  const [isPolling, setIsPolling] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastPollingTimeRef = useRef<number>(0);

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [voteResults, setVoteResults] = useState<number[]>([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [voteEnded, setVoteEnded] = useState(false);
  const [winningChoice, setWinningChoice] = useState<DAOChoice | null>(null);

  const [isVoting, setIsVoting] = useState(false);
  const [voteStatus, setVoteStatus] = useState<'idle' | 'success' | 'error'>(
    'idle',
  );
  const [voteError, setVoteError] = useState('');

  const description = branchPoint?.slug || 'default-branch';
  const duration = 300;
  const numOptions = branchPoint?.DAOChoice?.length || 2;
  const userAddresses = participants.map((p) => p.walletAddress);

  // ✅ 참여자 목록 불러오기
  useEffect(() => {
    if (!sessionId) return;

    api
      .get(`/api/sessions/${sessionId}/participants`)
      .then((res) => {
        const raw = res.data ?? [];
        const parsed = raw
          .filter((p: any) => p.user?.walletAddress)
          .map((p: any) => ({
            userId: p.user.id,
            walletAddress: p.user.walletAddress,
          }));
        setParticipants(parsed);
      })
      .catch(() => {
        setProposalError('참여자 목록 불러오기 실패');
      });
  }, [sessionId]);

  // 폴링 중지 함수
  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    setIsPolling(false);
  };

  // ✅ 투표 결과 새로고침 (Infura API 호출 최소화)
  const refreshVoteResults = async () => {
    if (proposalId === null || !dao) return;
    
    // 마지막 폴링 시간 확인 (최소 30초 간격으로 제한)
    const now = Date.now();
    if (now - lastPollingTimeRef.current < 30000) {
      console.log('폴링 간격 제한으로 인해 스킵 (30초 간격)');
      return;
    }
    
    lastPollingTimeRef.current = now;
    
    try {
      console.log('투표 결과 폴링 중...');
      const results: bigint[] = await dao.getProposalResults(proposalId);
      const numeric = results.map(Number);
      setVoteResults(numeric);
      setTotalVotes(numeric.reduce((a, b) => a + b, 0));

      const max = Math.max(...numeric);
      const idx = numeric.findIndex((v) => v === max);
      const winning = branchPoint?.DAOChoice?.[idx] ?? null;
      setWinningChoice(winning);
      
      // 프로포절 상태 확인 (active 여부)
      const proposals = await dao.getAllProposals();
      const current = proposals[proposalId];
      
      if (!current.active && !voteEnded) {
        console.log('프로포절이 종료되었습니다.');
        setVoteEnded(true);
        stopPolling();
        onVoteEnd?.();
      }
    } catch (err) {
      console.error('투표 결과 갱신 실패:', err);
    }
  };

  // Proposal 생성 또는 확인
  useEffect(() => {
    if (
      !dao ||
      !branchPoint ||
      userAddresses.length === 0 ||
      proposalCreated ||
      proposalChecked
    )
      return;

    setProposalChecked(true);
    setIsInitializingProposal(true); // 초기화 시작
    onProposalInitStart?.(); // 콜백 호출

    (async () => {
      try {
        const proposals = await dao.getAllProposals();

        const isSameAddressSet = (a: string[], b: string[]) => {
          const norm = (arr: string[]) =>
            arr.map((addr) => addr.toLowerCase()).sort();
          return JSON.stringify(norm(a)) === JSON.stringify(norm(b));
        };

        const existing = proposals.find(
          (p: any) =>
            p.description === description &&
            isSameAddressSet(p.users, userAddresses),
        );

        if (existing) {
          const existingId = proposals.indexOf(existing);
          setProposalId(existingId);
          console.log('existing', existing);
          console.log('existing proposalId: ', proposals.indexOf(existing));
          setProposalCreated(true);

          // 종료 여부 확인
          if (!existing.active) {
            setVoteEnded(true);
            const results: bigint[] = await dao.getProposalResults(existingId);
            const numeric = results.map(Number);
            setVoteResults(numeric);
            setTotalVotes(numeric.reduce((a, b) => a + b, 0));
            const max = Math.max(...numeric);
            const idx = numeric.findIndex((v) => v === max);
            const winning = branchPoint?.DAOChoice?.[idx] ?? null;
            setWinningChoice(winning);
            onVoteEnd?.();
          } else {
            // 활성화된 프로포절이면 폴링 시작
            startPolling();
          }

          return;
        }

        const res = await api.post('/api/dao/create', {
          description,
          duration,
          numOptions,
          users: userAddresses,
        });

        if (!res.data.success) {
          throw new Error(res.data.message || '프로포절 생성 실패');
        }

        const createdId = res.data.proposalId;
        setProposalId(createdId);
        console.log('created proposalId: ', createdId);
        setProposalCreated(true);
        
        // 생성 후 폴링 시작
        startPolling();
      } catch (err: any) {
        console.error('Proposal 생성 오류:', err);
        setProposalError(err.message || 'Proposal 생성 실패');
      } finally {
        setIsInitializingProposal(false); // 초기화 완료
        onProposalInitComplete?.(); // 콜백 호출
      }
    })();
  }, [dao, branchPoint, userAddresses, proposalCreated, proposalChecked]);

  // 상태 폴링 시작 함수
  const startPolling = () => {
    if (isPolling || !proposalId) return;
    
    setIsPolling(true);
    lastPollingTimeRef.current = Date.now();
    
    // 초기 데이터 로드
    refreshVoteResults();
    
    // 폴링 시작 (매 1분마다)
    pollingIntervalRef.current = setInterval(refreshVoteResults, 60000);
  };

  // 컴포넌트 언마운트 시 폴링 중지
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, []);

  // Proposal 상태 감시 - 폴링 방식으로 변경 (Infura API 호출 최소화)
  useEffect(() => {
    if (!dao || proposalId === null) return;
    
    // 이미 종료된 프로포절이면 폴링하지 않음
    if (voteEnded) return;
    
    // 폴링 중이 아니면 시작
    if (!isPolling) {
      startPolling();
    }
    
    // 투표 종료 시간 체크 (1분마다)
    const timeCheckInterval = setInterval(async () => {
      if (!dao || proposalId === null) return;
      
      try {
        const proposals = await dao.getAllProposals();
        const current = proposals[proposalId];
        const now = Math.floor(Date.now() / 1000);
        
        // 종료 시간 도달했지만 아직 active인 경우 종료 요청
        if (current.active && Number(current.voteEndTime) < now && !isClosingProposal) {
          console.log('⏰ Proposal 마감 시간 도달, closeProposal 요청');
          setIsClosingProposal(true);
          onProposalCloseStart?.();
          
          try {
            // closeProposal API 호출
            const res = await api.post(`/api/dao/${proposalId}/close`, {});
            console.log('Close API 응답:', res.data);
            
            // API 응답 후 바로 종료 처리하지 않고 폴링으로 확인
            // 상태 변경을 감지할 때까지 폴링 주기 단축 (10초마다)
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
            }
            
            pollingIntervalRef.current = setInterval(async () => {
              try {
                const refreshedProposals = await dao.getAllProposals();
                const current = refreshedProposals[proposalId];
                
                if (!current.active) {
                  console.log('프로포절이 성공적으로 종료되었습니다.');
                  setVoteEnded(true);
                  onVoteEnd?.();
                  
                  // 결과 업데이트
                  await refreshVoteResults();
                  
                  // 폴링 중지
                  stopPolling();
                  
                  // 이미 로딩 상태면 완료 처리
                  if (isClosingProposal) {
                    setIsClosingProposal(false);
                    onProposalCloseComplete?.();
                  }
                }
              } catch (error) {
                console.error('폴링 중 오류:', error);
              }
            }, 10000);
          } catch (error) {
            console.error('closeProposal 요청 실패:', error);
            // 실패해도 일정 시간 후 로딩 상태 해제
            setTimeout(() => {
              setIsClosingProposal(false);
              onProposalCloseComplete?.();
            }, 5000);
          }
        }
      } catch (error) {
        console.error('프로포절 시간 체크 중 오류:', error);
      }
    }, 60000); // 1분마다 시간 체크
    
    return () => {
      clearInterval(timeCheckInterval);
    };
  }, [dao, proposalId, voteEnded, isPolling, isClosingProposal]);

  // 투표 처리
  const handleVote = async (optionIndex: number) => {
    console.log('Voting number', optionIndex);
    if (!dao || proposalId === null || isVoting) return;
    setIsVoting(true);
    setVoteStatus('idle');
    setVoteError('');
    
    onVoteStart?.();

    try {
      const tx = await dao.vote(proposalId, optionIndex);
      await tx.wait();

      await refreshVoteResults();
      setVoteStatus('success');
    } catch (err: any) {
      console.error('투표 실패:', err);
      setVoteStatus('error');
      setVoteError(err.message || '투표에 실패했습니다.');
    } finally {
      setIsVoting(false);
      onVoteComplete?.();
    }
  };

  return {
    proposalId,
    proposalError,
    voteResults,
    totalVoters: participants.length,
    totalVotes,
    voteEnded,
    winningChoice,
    isVoting,
    voteStatus,
    voteError,
    handleVote,
    isInitializingProposal,
    isClosingProposal,
  };
}
