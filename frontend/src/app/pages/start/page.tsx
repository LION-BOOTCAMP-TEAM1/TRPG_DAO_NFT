import { Metadata } from 'next';
import StartClient from './StartClient';

const metadata: Metadata = {
  title: 'Start Page',
  description: 'Select The NFT And Story',
};

export default function StartPage() {
  return <StartClient />;
}
