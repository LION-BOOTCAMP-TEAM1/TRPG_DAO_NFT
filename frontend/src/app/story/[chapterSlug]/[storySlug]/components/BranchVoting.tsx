import { DAOChoice } from '../types/story';

interface BranchVotingProps {
  branchPoint: any;
  voteResults: number[];
  totalVoters: number;
  totalVotes: number;
  isVoting: boolean;
  voteStatus: 'idle' | 'success' | 'error';
  voteError: string;
  handleVote: (choiceId: number) => void;
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
}: BranchVotingProps) => (
  <div className="space-y-2 mt-6">
    {branchPoint.DAOChoice?.map((choice: DAOChoice) => (
      <button
        key={choice.id}
        className="w-full text-left p-3 rounded-lg border border-gray-300 hover:bg-gray-100 transition"
        onClick={() => handleVote(choice.id)}
        disabled={isVoting}
      >
        <span className="font-medium">{choice.text}</span>{' '}
        <span className="text-gray-500">
          ({voteResults[choice.id - 1] ?? 0}표)
        </span>
      </button>
    ))}
    <p className="text-sm text-gray-500 mt-3">
      총 투표 가능 인원: <strong>{totalVoters}</strong> / 현재 투표 인원:{' '}
      <strong>{totalVotes}</strong>
    </p>
    {voteStatus === 'success' && (
      <p className="text-green-600 mt-2">✅ 투표 완료!</p>
    )}
    {voteStatus === 'error' && (
      <p className="text-red-600 mt-2">❌ {voteError}</p>
    )}
  </div>
);
