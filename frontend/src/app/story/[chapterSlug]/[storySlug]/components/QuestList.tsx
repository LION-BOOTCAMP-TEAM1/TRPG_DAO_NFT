'use client';

import { Quest } from '../types/story';
import { useQuestDetail } from '../hooks/useQuestDetail';
import ChoiceGroupRenderer from './ChoiceGroupRenderer';

interface Props {
  quests: Quest[];
}

const QuestList = ({ quests }: Props) => {
  return (
    <div>
      <h2 className="text-xl font-semibold mt-6 text-[#3e2d1c]">퀘스트</h2>
      {quests.map((q) => {
        const { quest } = useQuestDetail(q.id);
        if (!quest) return null;

        return (
          <ChoiceGroupRenderer
            key={quest.id}
            title={quest.title}
            description={quest.description}
            choices={quest.choices
              .filter((c) => c.nextStorySlug !== null)
              .map((c) => ({
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

export default QuestList;
