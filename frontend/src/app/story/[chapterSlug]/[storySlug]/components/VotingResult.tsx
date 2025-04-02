import { DAOChoice } from '../types/story';
import { useRouter } from 'next/navigation';

interface VotingResultProps {
  branchPoint: any;
  voteResults: number[];
  totalVoters: number;
  totalVotes: number;
  winningChoice: DAOChoice;
  chapterSlug: string;
}

export const VotingResult = ({
  branchPoint,
  voteResults,
  totalVoters,
  totalVotes,
  winningChoice,
  chapterSlug,
}: VotingResultProps) => {
  const router = useRouter();

  return (
    <div className="mt-6 space-y-4">
      <h3 className="text-lg font-semibold text-green-700">
        ✅ 투표가 종료되었습니다!
      </h3>
      {branchPoint.DAOChoice.map((choice: DAOChoice) => (
        <div
          key={choice.id}
          className={`p-3 rounded border ${
            choice.id === winningChoice.id
              ? 'border-green-600 bg-green-50'
              : 'border-gray-300 bg-white'
          }`}
        >
          <span className="font-medium">{choice.text}</span>{' '}
          <span className="text-sm text-gray-500">
            ({voteResults[choice.id - 1] ?? 0}표)
          </span>
        </div>
      ))}
      <p className="text-sm text-gray-500">
        총 투표 가능 인원: <strong>{totalVoters}</strong> / 실제 투표 인원:{' '}
        <strong>{totalVotes}</strong>
      </p>
      <button
        className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        onClick={() =>
          router.push(
            `/story/${chapterSlug}/${
              winningChoice.nextStorySlug ?? winningChoice.nextStoryId
            }`,
          )
        }
      >
        다음 스토리로 이동 →
      </button>
    </div>
  );
};
