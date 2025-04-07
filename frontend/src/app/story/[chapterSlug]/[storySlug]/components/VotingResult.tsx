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
      <h3 className="text-lg font-semibold text-fantasy-forest">
        ✅ 투표가 종료되었습니다!
      </h3>
      {branchPoint.DAOChoice.map((choice: DAOChoice) => (
        <div
          key={choice.id}
          className={`p-3 rounded border ${
            choice.id === winningChoice.id
              ? 'border-fantasy-forest bg-fantasy-surface'
              : 'border-fantasy-copper bg-fantasy-background'
          }`}
        >
          <span className="font-medium text-fantasy-text">{choice.text}</span>{' '}
          <span className="text-sm text-fantasy-text/60">
            ({voteResults[choice.id - 1] ?? 0}표)
          </span>
        </div>
      ))}
      <p className="text-sm text-fantasy-text/70">
        총 투표 가능 인원: <strong>{totalVoters}</strong> / 실제 투표 인원:{' '}
        <strong>{totalVotes}</strong>
      </p>
      <button
        className="mt-4 px-6 py-3 bg-fantasy-surface dark:bg-fantasy-surface/80 text-fantasy-text font-bold rounded-lg shadow-md hover:shadow-lg transition-all border-2 border-fantasy-text flex items-center justify-center w-full md:w-auto"
        onClick={() =>
          router.push(
            `/story/${chapterSlug}/${
              winningChoice.nextStorySlug ?? winningChoice.nextStoryId
            }`,
          )
        }
      >
        다음 스토리로 이동 <span className="ml-2">→</span>
      </button>
    </div>
  );
};
