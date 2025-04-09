'use client';

import Link from 'next/link';
import Image from 'next/image';
import { StorySummary } from '../types/story';
import FantasyButton from '../../components/FantasyButton';

interface Props {
  story: StorySummary;
}

const StoryCard = ({ story }: Props) => {
  return (
    <div className="group relative flex flex-col sm:flex-row gap-4 items-center rounded-lg overflow-hidden shadow-md 
                   border border-fantasy-copper bg-gradient-to-r from-fantasy-background to-fantasy-surface 
                   hover:shadow-[0_0_15px_rgba(166,124,82,0.3)] transition-all duration-300
                   hover:-translate-y-1">
      {/* Decorative corner accents */}
      <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-fantasy-gold opacity-50 group-hover:opacity-100 transition-opacity"></div>
      <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-fantasy-gold opacity-50 group-hover:opacity-100 transition-opacity"></div>
      <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-fantasy-gold opacity-50 group-hover:opacity-100 transition-opacity"></div>
      <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-fantasy-gold opacity-50 group-hover:opacity-100 transition-opacity"></div>
      
      {/* Image container with overlay effect */}
      <div className="relative overflow-hidden sm:w-[300px] w-full">
        <Image
          src={`/story/story${story.id}.png`}
          alt={story.title}
          width={300}
          height={180}
          className="object-cover w-full h-[200px] sm:h-[180px] group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-70"></div>
      </div>
      
      {/* Content section */}
      <div className="flex-1 px-6 py-4 sm:pr-8">
        <h2 className="text-xl font-continuous font-semibold text-fantasy-text group-hover:text-fantasy-magic transition-colors">
          {story.title}
        </h2>
        <div className="w-16 h-0.5 bg-fantasy-gold mt-2 mb-3 group-hover:w-24 transition-all duration-300"></div>
        <p className="text-sm text-fantasy-text/80 mb-4">{story.description}</p>
        
        {/* Using FantasyButton component */}
        <FantasyButton href={`/create`} size="sm">
          Explore
        </FantasyButton>
      </div>
    </div>
  );
};

export default StoryCard;
