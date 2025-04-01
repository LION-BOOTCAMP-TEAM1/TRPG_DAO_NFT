'use client';
import { useState } from 'react';
import ThemeProvider from '../../components/ThemeProvider';
import '../../../styles/globals.css';
import Header from '../../components/Header';
import Link from 'next/link';
import useWallet from '../../hook/useWallet';

export default function HomePage() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const {
    connectWallet,
    registerWalletAddress,
    disconnect,
    signer,
    walletExist,
  } = useWallet();

  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  return (
    <ThemeProvider isDarkMode={isDarkMode}>
      <div>
        <Header
          onToggle={toggleTheme}
          isDarkMode={isDarkMode}
          connectWallet={connectWallet}
          registerWalletAddress={registerWalletAddress}
          disconnect={disconnect}
          walletExist={walletExist}
          signer={signer}
        />

        {/* main */}
        <main className="flex flex-col justify-center items-center gap-2">
          <img src="/main.png" alt="main" />
          <img src="/crown.png" className="w-10" />

          <h1 className="text-2xl font-bold">TRPG · DAO · NFT</h1>
          <h1 className="text-2xl font-bold">Web3 Game</h1>
          <h1 className="text-xl font-extrabold text-gray-500">
            Discover why over 20 million players choose CRPG.
          </h1>
          <h1>
            CRPG is an innovative game where players build the game world, own
            in-game assets as NFTs, and influence the game's direction through a
            DAO system.
          </h1>
          <h1>
            By leveraging Web3 technology, it maximizes economic participation
            and community impact, offering true ownership and transparent
            governance. Every player can create their own unique experience.
          </h1>

          {/* main footer */}
          <footer className="py-7 ">
            <Link href={'/pages/playpage'}>
              <button className="w-30 cursor-pointer hover:bg-gray-200 rounded-2xl">
                <img src="/playbutton.png" />
              </button>
            </Link>
          </footer>
          <div className="border-b-1 border-gray-200 py-5">
            <img src="/Name.png" alt="name" className="w-400 h-20" />
          </div>
        </main>
      </div>

      {/* main2 */}
      <div className="w-400 mx-auto py-20">
        <div className="flex flex-col justify-center items-center">
          <h1 className="text-2xl font-bold pb-10">
            Exchange various NFTs and be strong.
          </h1>
          <img src="/Mainex.png" />
          <div className="p-10 flex flex-col justify-center items-center text-xl">
            <h1>
              NFTs are used as character enhancements and special story items.
            </h1>
            <h1>
              Complete the various stories and receive achievement NFTs to trade
            </h1>
            <h1>with others and earn profits!</h1>
          </div>
        </div>
        <div className="flex flex-col justify-center items-center py-20 border-t-1 border-gray-200">
          <h1 className="text-2xl font-bold pb-4">DAO</h1>
          <h1 className="text-2xl font-bold pb-10 ">Vote and Decide</h1>
          <img src="/Dao.png" alt="Dao" />
          <h1 className="text-xl  py-10 ">
            You can pioneer your own destiny and decide by using DAO.
          </h1>
          Enjoy CRPG with great freedom.
          <div className="p-10">
            <button className="bg-sky-300 px-3 pb-1 rounded-xl text-3xl font-bold border border-gray-400 drop-shadow-[0_1.2px_1.2px_rgba(1,1,1,1)] hover:bg-sky-500 cursor-pointer">
              Sign Up
            </button>
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
}
