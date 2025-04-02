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
      <h3 className="text-lg font-semibold text-[#3e2d1c]">퀘스트 선택</h3>
      {story.quests.map((quest) => (
        <div key={quest.id} className="border rounded-lg p-4 bg-white/80">
          <p className="font-medium mb-2">{quest.title}</p>
          {quest.choices.map((choice) => (
            <button
              key={choice.id}
              className="block w-full text-left p-2 mt-1 rounded border border-gray-300 hover:bg-gray-100"
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
