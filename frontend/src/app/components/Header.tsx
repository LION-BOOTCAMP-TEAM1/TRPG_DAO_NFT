import { FC, useEffect, useState } from 'react';
import Link from 'next/link';
import ThemeToggleButton from './ThemeToggleButton';
import Modal from './modal';
import { FaWallet } from 'react-icons/fa';
import { FaPerson } from 'react-icons/fa6';
import { RiProhibited2Line } from 'react-icons/ri';
import Login from './login/Login';
import useAuth from '../hook/useAuth';

interface HeaderProps {
  onToggle: () => void;
  isDarkMode: boolean;
}

const Header: FC<HeaderProps> = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  const { isAuthenticated, user, logout } = useAuth();

  useEffect(() => {
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  const onToggle = () => {
    setIsDarkMode((prev) => !prev);
  };

  return (
    <div className="max-w-screen">
      <header className="border-b-2 border-gray-400 px-12">
        <div className="flex items-center text-2xl font-bold">
          {/* Logo */}
          <Link href={'/'}>
            <img src="/Logo.png" alt="logo" className="w-60" />
          </Link>

          <div className="flex flex-grow justify-evenly text-3xl gap-20">
            <Link href={'/pages/playpage'}>
              <button className="homemsst">Play</button>
            </Link>
            <button className="homemsst">Market</button>
            <button className="homemsst">Explore</button>
          </div>

          <div className="flex flex-row gap-4">
            {!isAuthenticated ? (
              <Login />
            ) : (
              // 모달 프롭스
              <Modal
                trigger={
                  <img
                    src="/checkbuttonon.png"
                    className="w-10 hover:bg-gray-600 rounded-2xl cursor-pointer"
                  />
                }
                isDarkMode={isDarkMode}
              >
                <div className="flex flex-col gap-3">
                  <div className="modalst">
                    <FaWallet />
                    <span>
                      {user?.walletAddress?.substring(0, 7)}...
                      {user?.walletAddress?.substring(
                        user.walletAddress.length - 5,
                      )}
                    </span>
                  </div>

                  <div className="modalst">
                    <FaPerson />
                    <button>Profile</button>
                  </div>

                  <div className="modalst">
                    <RiProhibited2Line />
                    <button className="homemsst" onClick={() => logout()}>
                      Disconnect
                    </button>
                  </div>
                </div>
              </Modal>
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
