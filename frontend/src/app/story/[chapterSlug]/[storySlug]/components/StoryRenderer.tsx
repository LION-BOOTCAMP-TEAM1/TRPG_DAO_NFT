import QuestList from './QuestList';
import BranchPointList from './BranchPointList';
import { BranchPoint, Quest } from '../types/story';

interface Props {
  isSceneComplete: boolean;
  quests: Quest[];
  branchPoints: BranchPoint[];
}

const StoryRenderer = ({ isSceneComplete, quests, branchPoints }: Props) => {
  if (!isSceneComplete) return null;

  return (
    <>
      {branchPoints.length > 0 && (
        <BranchPointList branchPoints={branchPoints} />
      )}
      {quests.length > 0 && <QuestList quests={quests} />}
    </>
  );
};

export default StoryRenderer;
