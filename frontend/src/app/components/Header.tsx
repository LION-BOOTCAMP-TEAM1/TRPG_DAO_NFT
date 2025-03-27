'use client';
import { FC, useState } from 'react';
import Link from 'next/link';
import ThemeToggleButton from './ThemeToggleButton';
import { JsonRpcSigner } from 'ethers';

interface HeaderProps {
  onToggle: () => void;
  isDarkMode: boolean;
  connectWallet: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
  registerWalletAddress: () => void;
  disconnect: () => void;
  walletExist: boolean;
  signer: JsonRpcSigner | null;
}

const Header: FC<HeaderProps> = ({
  onToggle,
  isDarkMode,
  connectWallet,
  registerWalletAddress,
  disconnect,
  walletExist,
  signer,
}) => {
  const [showDisconnect, setShowDisconnect] = useState(false);
  return (
    <div className="w-400 mx-auto">
      <header className="bg-red- border-b-2 border-gray-400">
        <div className="flex items-center text-2xl font-bold">
          {/* Logo */}
          <Link href={'/'}>
            <img src="/Logo.png" alt="logo" className="w-60" />
          </Link>

          <div className="flex flex-grow justify-center text-3xl gap-20 ">
            <Link href={'/playpage'}>
              <button className="cursor-pointer hover:text-gray-500">
                Play
              </button>
            </Link>
            <button className="cursor-pointer hover:text-gray-500">
              Market
            </button>
            <button className="cursor-pointer hover:text-gray-500">
              Explore
            </button>
          </div>

          <div className="flex flex-row ml-auto gap-4 ">
            <button className="cursor-pointer hover:text-gray-500">
              Profile
            </button>
            {!signer ? (
              <form onSubmit={connectWallet}>
                <button
                  type="submit"
                  className="cursor-pointer hover:text-gray-500"
                >
                  Login
                </button>
              </form>
            ) : (
              <div className=" flex flex-row  items-center">
                <img src="/checkbuttonon.png" className="w-8" />
                <div
                  onMouseEnter={() => setShowDisconnect(true)} // 마우스를 올리면 Disconnect 보이기
                  onMouseLeave={() => setShowDisconnect(false)} // 마우스를 떼면 다시 숨기기
                >
                  {!showDisconnect && ( // 마우스를 올렸을 때만 Disconnect 버튼 보이기
                    <p className="text-xs">
                      {signer.address.substring(0, 7)}...
                      {signer.address.substring(signer.address.length - 5)}
                    </p>
                  )}

                  {showDisconnect && ( // 마우스를 올렸을 때만 Disconnect 버튼 보이기
                    <button
                      className="cursor-pointer hover:text-gray-500 text-base"
                      onClick={disconnect}
                    >
                      Disconnect
                    </button>
                  )}
                </div>
              </div>
            )}
            {/* 지갑 등록 버튼 */}
            {!walletExist && signer && (
              <button
                className="cursor-pointer hover:text-gray-500"
                onClick={registerWalletAddress}
              >
                Register Wallet
              </button>
            )}

            {/* 다크 모드 토글 버튼 */}
            <ThemeToggleButton onToggle={onToggle} isDarkMode={isDarkMode} />
          </div>
        </div>
      </header>
    </div>
  );
};

export default Header;
