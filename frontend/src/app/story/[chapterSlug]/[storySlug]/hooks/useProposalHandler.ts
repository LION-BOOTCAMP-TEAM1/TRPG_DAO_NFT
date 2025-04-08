import { useEffect, useState } from 'react';
import type { DAOChoice } from '../types/story';
import { EventLog } from 'ethers';
import api from '@/lib/axios';

interface UseProposalHandlerProps {
  dao: any;
  branchPoint: any;
  sessionId: number;
  onVoteEnd?: () => void;
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
}: UseProposalHandlerProps) {
  const [proposalId, setProposalId] = useState<number | null>(null);
  const [proposalCreated, setProposalCreated] = useState(false);
  const [proposalChecked, setProposalChecked] = useState(false);
  const [proposalError, setProposalError] = useState('');

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

  // ✅ 투표 결과 새로고침
  const refreshVoteResults = async () => {
    if (proposalId === null || !dao) return;
    try {
      // 5초 대기
      await new Promise((resolve) => setTimeout(resolve, 5000));

      const results: bigint[] = await dao.getProposalResults(proposalId);
      const numeric = results.map(Number);
      setVoteResults(numeric);
      setTotalVotes(numeric.reduce((a, b) => a + b, 0));

      const max = Math.max(...numeric);
      const idx = numeric.findIndex((v) => v === max);
      const winning = branchPoint?.DAOChoice?.[idx] ?? null;
      setWinningChoice(winning);
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
      } catch (err: any) {
        console.error('Proposal 생성 오류:', err);
        setProposalError(err.message || 'Proposal 생성 실패');
      }
    })();
  }, [dao, branchPoint, userAddresses, proposalCreated, proposalChecked]);

  // Proposal 상태 감시 (시간 + 이벤트 기준)
  useEffect(() => {
    if (!dao || proposalId === null) return;

    const isClosingRef = { current: false };

    const interval = setInterval(async () => {
      if (isClosingRef.current) return;

      try {
        await refreshVoteResults();

        const proposals = await dao.getAllProposals();
        let current = proposals[proposalId];
        const now = Math.floor(Date.now() / 1000);

        if (current.active && Number(current.voteEndTime) < now) {
          console.log('⏰ Proposal 마감 시간 도달, closeProposal 실행');
          isClosingRef.current = true;

          try {
            const res = await api.post(`/api/dao/${proposalId}/close`, {});
            if (!res.data.success) {
              throw new Error(res.data.message || '프로포절 종료 실패');
            }

            const refreshedProposals = await dao.getAllProposals();
            current = refreshedProposals[proposalId];

            if (!current.active) {
              setVoteEnded(true);
              onVoteEnd?.();
            }
          } catch (err) {
            console.error('closeProposal 실패:', err);
          } finally {
            isClosingRef.current = false;
          }
        } else {
          if (!current.active) {
            setVoteEnded(true);
            onVoteEnd?.();
          }
        }
      } catch (err) {
        console.error('Proposal 상태 조회 실패:', err);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [dao, proposalId]);

  // 투표 처리
  const handleVote = async (optionIndex: number) => {
    console.log('Voting number', optionIndex);
    if (!dao || proposalId === null || isVoting) return;
    setIsVoting(true);
    setVoteStatus('idle');
    setVoteError('');

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
  };
}
