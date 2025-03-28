// frontend/src/app/story/[chapterSlug]/[storySlug]/page.tsx

import { Metadata } from 'next';
import DetailClient from './DetailClient';

export const metadata: Metadata = {
  title: 'Story Detail',
  description: 'Story and chapter detail view',
};

export default function StoryDetailPage() {
  return <DetailClient />;
}
