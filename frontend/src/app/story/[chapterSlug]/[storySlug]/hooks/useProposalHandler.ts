import { useEffect, useState } from 'react';
import type { DAOChoice } from '../types/story';
import { EventLog } from 'ethers';

interface UseProposalHandlerProps {
  dao: any;
  branchPoint: any;
  sessionId: number;
  onVoteEnd?: () => void;
}

export function useProposalHandler({
  dao,
  branchPoint,
  sessionId,
  onVoteEnd,
}: UseProposalHandlerProps) {
  const [proposalId, setProposalId] = useState<number | null>(null);
  const [proposalCreated, setProposalCreated] = useState(false);
  const [proposalError, setProposalError] = useState('');

  const [voteResults, setVoteResults] = useState<number[]>([]);
  const [totalVoters, setTotalVoters] = useState(0);
  const [totalVotes, setTotalVotes] = useState(0);

  const [voteEnded, setVoteEnded] = useState(false);
  const [winningChoice, setWinningChoice] = useState<DAOChoice | null>(null);

  const [isVoting, setIsVoting] = useState(false);
  const [voteStatus, setVoteStatus] = useState<'idle' | 'success' | 'error'>(
    'idle',
  );
  const [voteError, setVoteError] = useState('');

  const dummy = {
    description: branchPoint?.slug || 'default-branch',
    sessionId,
    scope: 1,
    duration: 300,
    numOptions: branchPoint?.DAOChoice?.length || 2,
  };

  const refreshVoteResults = async () => {
    const results: bigint[] = await dao?.getProposalResults(proposalId);
    const numeric = results.map(Number);
    setVoteResults(numeric);
    setTotalVotes(numeric.reduce((a, b) => a + b, 0));
  };

  // proposal 생성 또는 불러오기
  useEffect(() => {
    if (!dao || !branchPoint || proposalCreated) return;

    (async () => {
      try {
        const proposals = await dao.getAllProposals();
        const index = proposals.findIndex(
          (p: any) =>
            p.description === dummy.description &&
            p.scopeId.toString() === dummy.sessionId.toString(),
        );

        if (index !== -1) {
          setProposalId(index);
          setProposalCreated(true);
          return;
        }

        const tx = await dao.createProposal(
          dummy.description,
          dummy.duration,
          dummy.scope,
          dummy.sessionId,
          dummy.numOptions,
        );

        const receipt = await tx.wait();
        const createdEvents = await dao.queryFilter(
          dao.filters.ProposalCreated(),
          receipt.blockNumber,
          receipt.blockNumber,
        );

        const created = createdEvents.find(
          (e: EventLog): e is EventLog =>
            'args' in e && e.args?.description === dummy.description,
        );

        if (created) {
          setProposalId(Number(created.args.proposalId));
          setProposalCreated(true);
        }
      } catch (err: any) {
        setProposalError(err.message || 'Proposal creation failed');
      }
    })();
  }, [dao, branchPoint, proposalCreated]);

  // proposal 결과 감시
  useEffect(() => {
    if (!dao || !branchPoint || proposalId === null) return;

    (async () => {
      try {
        const results: bigint[] = await dao.getProposalResults(proposalId);
        const eligible = await dao.getTotalEligibleVoters(sessionId);
        const numeric = results.map(Number);

        setVoteResults(numeric);
        setTotalVoters(Number(eligible));
        setTotalVotes(numeric.reduce((a, b) => a + b, 0));

        const closedLogs = await dao.queryFilter(
          dao.filters.ProposalClosed(),
          0,
          'latest',
        );
        const matched = closedLogs.find(
          (log: EventLog) =>
            'args' in log && Number(log.args.proposalId) === proposalId,
        );
        if (matched) {
          setVoteEnded(true);
          const max = Math.max(...numeric);
          const idx = numeric.findIndex((v) => v === max);
          setWinningChoice(branchPoint.DAOChoice?.[idx] ?? null);
        }
      } catch (err) {
        console.error('Proposal 상태 조회 실패:', err);
      }
    })();
  }, [dao, proposalId]);

  const handleVote = async (optionIndex: number) => {
    if (!dao || proposalId === null || isVoting) return;
    setIsVoting(true);
    setVoteStatus('idle');
    setVoteError('');

    try {
      dao.once('Voted', async (pid: bigint) => {
        if (Number(pid) === proposalId) {
          await refreshVoteResults();
          setVoteStatus('success');
        }
      });

      dao.once('ProposalClosed', async (pid: bigint) => {
        if (Number(pid) === proposalId) {
          const results: bigint[] = await dao.getProposalResults(proposalId);
          const numeric = results.map(Number);
          const max = Math.max(...numeric);
          const idx = numeric.findIndex((v) => v === max);

          setVoteResults(numeric);
          setTotalVotes(numeric.reduce((a, b) => a + b, 0));
          setVoteEnded(true);
          setWinningChoice(branchPoint?.DAOChoice?.[idx] ?? null);
          onVoteEnd?.();
        }
      });

      const tx = await dao.vote(proposalId, optionIndex);
      await tx.wait();
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
    totalVoters,
    totalVotes,
    voteEnded,
    winningChoice,
    isVoting,
    voteStatus,
    voteError,
    handleVote,
  };
}
