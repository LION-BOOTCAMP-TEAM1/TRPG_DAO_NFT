// frontend/src/app/story/[id]/page.tsx

import { Metadata } from 'next';
import DetailClient from './DetailClient';

export const metadata: Metadata = {
  title: 'Story Detail Page',
  description: 'Select The NFT And Story',
};

export default function StoryPage() {
  return <DetailClient />;
}
