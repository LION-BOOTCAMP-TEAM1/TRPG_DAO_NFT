import { Metadata } from 'next';
import StoryListClient from './StoryListClient';

export const metadata: Metadata = {
  title: 'Story Page',
  description: 'Select The NFT And Story',
};

export default function StoryListPage() {
  return <StoryListClient />;
}
