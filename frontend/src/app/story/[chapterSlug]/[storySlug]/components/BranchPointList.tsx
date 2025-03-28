'use client';

import { BranchPoint, DAOChoice } from '../types/story';
import { useBranchDetail } from '../hooks/useBranchDetail';
import ChoiceGroupRenderer from './ChoiceGroupRenderer';

interface Props {
  branchPoints: BranchPoint[];
}

const BranchPointList = ({ branchPoints }: Props) => {
  return (
    <div>
      <h2 className="text-xl font-semibold mt-6 text-[#3e2d1c]">분기점</h2>
      {branchPoints.map((bp) => {
        const { branch } = useBranchDetail(bp.id);
        if (!branch) return null;
        if (!branch.DAOChoice) return null;

        return (
          <ChoiceGroupRenderer
            key={branch.id}
            title={branch.title}
            description={branch.description}
            choices={branch.DAOChoice.filter(
              (c) => c.nextStorySlug !== null,
            ).map((c) => ({
              id: c.id,
              text: c.text,
              nextStorySlug: c.nextStorySlug as string,
            }))}
          />
        );
      })}
    </div>
  );
};

export default BranchPointList;
