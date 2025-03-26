import { BranchPoint } from '@/app/story/[id]/types/story';

interface Props {
  branchPoints: BranchPoint[];
}

const BranchPointList = ({ branchPoints }: Props) => {
  return (
    <div>
      <h2 className="text-xl font-semibold mt-6 text-[#3e2d1c]">분기점</h2>
      {branchPoints.map((bp) => (
        <div key={bp.id} className="mt-2">
          <p className="font-medium text-[#3e2d1c]">{bp.title}</p>
          <p className="text-sm text-[#5e4b3c]">{bp.description}</p>
        </div>
      ))}
    </div>
  );
};

export default BranchPointList;
