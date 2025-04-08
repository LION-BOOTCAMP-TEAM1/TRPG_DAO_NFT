import { Metadata } from 'next';
import DetailClient from './DetailClient';
import CharacterStat from '@/app/components/characterStat/CharacterStat';
import UnloadHandler from '@/app/components/UnloadHandler';

export const metadata: Metadata = {
  title: 'Story Detail',
  description: 'Story and chapter detail view',
};

export default function StoryDetailPage() {
  return (
    <div className="flex flex-row w-full pt-12 bg-fantasy-background text-fantasy-text">
      <div className="flex-[4]">
        <DetailClient />
      </div>
      <UnloadHandler isBlocking />
      <div className="h-auto w-px bg-fantasy-copper/30" />

      <div className="flex-[1] p-4">
        <div className="sticky top-4">
          <CharacterStat />
        </div>
      </div>
    </div>
  );
}
