import { Metadata } from 'next';
import DetailClient from './DetailClient';
import CharacterStat from '@/app/components/characterStat/CharacterStat';

export const metadata: Metadata = {
  title: 'Story Detail',
  description: 'Story and chapter detail view',
};

export default function StoryDetailPage() {
  return (
    <div className="flex flex-row w-full pt-12">
      <div className="flex-[4]">
        <DetailClient />
      </div>

      <div className="h-auto w-px" />

      <div className="flex-[1] p-4">
        <div className="sticky top-4">
          <CharacterStat />
        </div>
      </div>
    </div>
  );
}
