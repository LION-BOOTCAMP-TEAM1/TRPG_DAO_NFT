import { Metadata } from 'next';
import ChapterClient from './ChapterClient';

export const metadata: Metadata = {
  title: 'Chapter Detail',
  description: 'TRPG Chapter Viewer',
};

export default function ChapterPage() {
  return <ChapterClient />;
}
