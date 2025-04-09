import { useEffect } from 'react';
import { DAOChoice } from '../types/story';
import { toast } from 'sonner';

interface BranchVotingProps {
  branchPoint: any;
  voteResults: number[];
  totalVoters: number;
  totalVotes: number;
  isVoting: boolean;
  voteStatus: 'idle' | 'success' | 'error';
  voteError: string;
  handleVote: (choiceIndex: number) => void;
}

export const BranchVoting = ({
  branchPoint,
  voteResults,
  totalVoters,
  totalVotes,
  isVoting,
  voteStatus,
  voteError,
  handleVote,
}: BranchVotingProps) => {
  useEffect(() => {
    if (voteStatus === 'error' && voteError) {
      toast.error('투표 실패', {
        description: voteError,
        id: 'vote-error',
      });
    } else if (voteStatus === 'success') {
      toast.success('투표 완료', {
        id: 'vote-success',
      });
    }
  }, [voteStatus, voteError]);

  return (
    <div className="space-y-2 mt-6">
      {branchPoint.DAOChoice?.map((choice: DAOChoice, index: number) => (
        <button
          key={choice.id}
          className="w-full text-left p-3 rounded-lg border border-fantasy-copper hover:bg-fantasy-surface transition cursor-pointer"
          onClick={() => handleVote(index + 1)}
          disabled={isVoting}
        >
          <span className="font-medium text-fantasy-text">{choice.text}</span>{' '}
          <span className="text-fantasy-text/60">
            ({voteResults[index] ?? 0}표)
          </span>
        </button>
      ))}

      <p className="text-sm text-fantasy-text/70 mt-3">
        총 투표 가능 인원: <strong>{totalVoters}</strong> / 현재 투표 인원:{' '}
        <strong>{totalVotes}</strong>
      </p>
    </div>
  );
};
