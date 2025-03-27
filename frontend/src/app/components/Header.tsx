'use client';
import { FC, useState } from 'react';
import Link from 'next/link';
import ThemeToggleButton from './ThemeToggleButton';
import { JsonRpcSigner } from 'ethers';
import { FaWallet } from 'react-icons/fa';
import { FaPerson } from 'react-icons/fa6';
import { RiProhibited2Line } from 'react-icons/ri';
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
  signer,
  disconnect,
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);

  let timeout: NodeJS.Timeout;

  const handleMouseEnter = () => {
    // 마우스가 올려졌을 때 모달 표시
    clearTimeout(timeout);
    setIsModalVisible(true);
  };

  const handleMouseLeave = () => {
    // 마우스가 떠났을 때 일정 시간 후에 모달을 숨김
    timeout = setTimeout(() => {
      setIsModalVisible(false);
    }, 2000); // 300ms 대기 후 모달 숨김
  };
  return (
    <div className="w-400 mx-auto">
      <header className="bg-red- border-b-2 border-gray-400">
        <div className="flex items-center text-2xl font-bold">
          {/* Logo */}
          <Link href={'/'}>
            <img src="/Logo.png" alt="logo" className="w-60" />
          </Link>

          <div className="flex flex-grow justify-evenly text-3xl gap-20 ">
            <Link href={'/pages/playpage'}>
              <button className="homemsst">Play</button>
            </Link>
            <button className="homemsst">Market</button>
            <button className="homemsst">Explore</button>
          </div>

          <div className="flex flex-row gap-4 ">
            {!signer ? (
              <form onSubmit={connectWallet}>
                <button type="submit" className="homemsst">
                  Login
                </button>
              </form>
            ) : (
              <div className=" flex flex-row  items-center">
                <div
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                >
                  <img
                    src="/checkbuttonon.png"
                    className="w-10 hover:bg-gray-600 rounded-2xl"
                  />
                </div>
              </div>
            )}

            {/* 다크 모드 토글 버튼 */}
            <ThemeToggleButton onToggle={onToggle} isDarkMode={isDarkMode} />
          </div>
        </div>
      </header>

      {/* 모달 */}
      {isModalVisible && (
        <div className="fixed top-1/9 right-1/21  flex flex-col justify-center items-center z-50  bg-opacity-50 ">
          <div className=" bg-white p-6 rounded-lg shadow-2xl border-1 border-gray-200">
            <div className=" modalst">
              <FaWallet className="mt-1" />
              <span>
                {signer?.address?.substring(0, 7)}...
                {signer?.address?.substring(signer.address.length - 5)}
              </span>
            </div>
            <div>
              <div className="modalst">
                <FaPerson className="mt-1" />
                <button>Profile</button>
              </div>
              <div className=" modalst">
                <RiProhibited2Line className="mt-1" />
                <button className="homemsst" onClick={disconnect}>
                  Disconnect
                </button>
              </div>
            </div>

            <div className="flex justify-center items-center">
              <button
                className=" mt-4 bg-sky-500 text-white px-4 py-2 rounded-lg hover:bg-sky-600 cursor-pointer"
                onClick={() => setIsModalVisible(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Header;
