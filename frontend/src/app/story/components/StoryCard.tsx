'use client';

import Link from 'next/link';
import Image from 'next/image';
import { StorySummary } from '../types/story';

interface Props {
  story: StorySummary;
}

const StoryCard = ({ story }: Props) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4 items-center  rounded-lg overflow-hidden ">
      <Image
        src={`/story/story${story.id}.png`}
        alt={story.title}
        width={300}
        height={180}
        className="object-cover w-full sm:w-[300px] h-[180px]"
      />
      <div className="flex-1 px-4 py-3">
        <h2 className="text-lg font-semibold ">{story.title}</h2>
        <p className="text-sm  mb-2">{story.description}</p>
        <Link
          href={`/story/${story.id}`}
          className="inline-block bg-[#1e40af] text-white text-sm px-4 py-1 rounded hover:bg-[#374fc9] transition-colors"
        >
          Explore
        </Link>
      </div>
    </div>
  );
};

export default StoryCard;
