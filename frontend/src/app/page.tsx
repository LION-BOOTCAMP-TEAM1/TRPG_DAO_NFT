import { Metadata } from 'next';
import LoginClient from './login/LoginClient';

const metadata: Metadata = {
  title: 'Another World Adventure',
  description: 'Access Another world adventure by logging in.',
};

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center p-0 overflow-hidden">
      <div className="w-full h-full flex items-center justify-center">
        <img src="/image.png" alt="Background" className="h-screen w-screen" />
      </div>
      <div className="z-10 absolute top-10 left-1/2 transform -translate-x-1/2 w-full max-w-5xl items-center text-white drop-shadow-[0_1.2px_1.2px_rgba(1,1,1,1)]">
        <h1 className="text-5xl font-bold italic text-center ">
          Another World Adventure
        </h1>
        <p className="mt-4 text-center font-bold italic text-2xl">
          Welcome to the TRPG DAO NFT project
        </p>
      </div>

      <div>
        <LoginClient />
      </div>
    </main>
  );
}
