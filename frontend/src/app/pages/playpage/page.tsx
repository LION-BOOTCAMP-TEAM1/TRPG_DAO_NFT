'use client';

import { useState } from 'react';
import Header from '../../components/Header';
import ThemeProvider from '../../components/ThemeProvider';
import useWallet from '../../hook/useWallet';

export default function PlayPage() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const {
    connectWallet,
    registerWalletAddress,
    disconnect,
    signer,
    walletExist,
    loading,
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
      </div>

      <main className="flex flex-col bg-amber-50 m-20 mx-auto w-400 p-4 rounded-lg shadow-lg">
        {/* 게임 종류 선택 */}
        <div className="flex flex-row justify-evenly gap-4">
          <button
            className="border px-2 py-1 rounded-2xl cursor-pointer hover:bg-gray-100 transition"
            aria-label="Select Genre"
          >
            Genre
          </button>
          <button
            className="border px-2 py-1 rounded-2xl cursor-pointer hover:bg-gray-100 transition"
            aria-label="Select World"
          >
            World
          </button>
          <button
            className="border px-2 py-1 rounded-2xl cursor-pointer hover:bg-gray-100 transition"
            aria-label="Select Session"
          >
            Session
          </button>
        </div>

        {/* Genre 섹션 */}
        <div className="border bg-red-50 border-gray-100 shadow-xl flex flex-col items-center justify-center p-4 mt-4 rounded-lg">
          <h1 className="text-lg font-semibold">The Middle Ages</h1>
        </div>
      </main>
    </ThemeProvider>
  );
}
