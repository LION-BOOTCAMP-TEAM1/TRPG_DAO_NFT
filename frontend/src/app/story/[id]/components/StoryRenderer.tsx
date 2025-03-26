import BranchPointList from './BranchPointList';
import QuestList from './QuestList';
import { Quest, BranchPoint } from '@/app/story/[id]/types/story';

interface Props {
  isSceneComplete: boolean;
  quests: Quest[];
  branchPoints: BranchPoint[];
}

const StoryRenderer = ({ isSceneComplete, quests, branchPoints }: Props) => {
  return (
    <>
      {isSceneComplete && branchPoints.length > 0 && (
        <BranchPointList branchPoints={branchPoints} />
      )}
      {isSceneComplete && quests.length > 0 && <QuestList quests={quests} />}
    </>
  );
};

export default StoryRenderer;
