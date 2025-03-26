import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Quest } from '@/app/story/[id]/types/story';

interface Props {
  quests: Quest[];
}

const QuestList = ({ quests }: Props) => {
  const router = useRouter();

  return (
    <div>
      <h2 className="text-xl font-semibold mt-6 text-[#3e2d1c]">퀘스트</h2>
      {quests.map((q) => (
        <div key={q.id} className="mt-4">
          <p className="font-semibold text-[#3e2d1c]">{q.title}</p>
          <p className="text-sm text-[#6e5b4c] mb-2">{q.description}</p>
          {q.choices?.map((choice) => (
            <div
              key={choice.id}
              className="ml-4 mb-2 cursor-pointer flex items-start gap-2"
              onClick={() => {
                if (choice.nextStoryId) {
                  router.push(`/story/${choice.nextStoryId}`);
                }
              }}
            >
              <Image
                src="/choicebutton.png"
                alt="choice button"
                width={16}
                height={16}
                className="mt-1"
              />
              <p className="text-sm text-[#3e2d1c] hover:text-[#c25e3c]">
                {choice.text}
              </p>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default QuestList;
