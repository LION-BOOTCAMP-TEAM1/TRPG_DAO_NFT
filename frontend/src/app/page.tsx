import { Metadata } from 'next';
import HomePage from './home/page';

const metadata: Metadata = {
  title: 'Another World Adventure',
  description: 'Access Another world adventure by logging in.',
};

export default function Home() {
  return <HomePage />;
}
