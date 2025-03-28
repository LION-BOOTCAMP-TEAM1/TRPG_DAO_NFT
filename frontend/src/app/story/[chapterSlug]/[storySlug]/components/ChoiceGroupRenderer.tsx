'use client';

import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';

interface ChoiceGroupRendererProps {
  title: string;
  description: string;
  choices: { id: number; text: string; nextStorySlug: string }[];
}

const ChoiceGroupRenderer = ({
  title,
  description,
  choices,
}: ChoiceGroupRendererProps) => {
  const router = useRouter();
  const { chapterSlug } = useParams();

  return (
    <div className="mt-4 space-y-2">
      <p className="font-semibold text-[#3e2d1c]">{title}</p>
      <p className="text-sm text-[#5e4b3c]">{description}</p>

      <div className="ml-4 mt-2 space-y-1">
        {choices.map((choice) => (
          <div
            key={choice.id}
            className="flex items-start gap-2 cursor-pointer"
            onClick={() =>
              router.push(`/story/${chapterSlug}/${choice.nextStorySlug}`)
            }
          >
            <Image
              src="/choicebutton.png"
              alt="choice button"
              width={16}
              height={16}
              className="mt-1"
            />
            <p className="text-sm text-[#3e2d1c] hover:text-blue-700">
              {choice.text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChoiceGroupRenderer;
