import { useRouter } from 'next/navigation';
import { Story } from '../types/story';

export const QuestSelector = ({
  story,
  chapterSlug,
}: {
  story: Story;
  chapterSlug: string;
}) => {
  const router = useRouter();
  return (
    <div className="mt-6 space-y-2">
      <h3 className="text-lg font-semibold text-fantasy-text">퀘스트 선택</h3>
      {story.quests.map((quest) => (
        <div key={quest.id} className="border rounded-lg p-4 bg-fantasy-surface/80">
          <p className="font-medium mb-2 text-fantasy-text">{quest.title}</p>
          {quest.choices.map((choice) => (
            <button
              key={choice.id}
              className="block w-full text-left p-2 mt-1 rounded border border-fantasy-copper hover:bg-fantasy-surface cursor-pointer"
              onClick={() =>
                router.push(
                  `/story/${chapterSlug}/${choice.nextStorySlug ?? choice.nextStoryId}`,
                )
              }
            >
              {choice.text}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
};
