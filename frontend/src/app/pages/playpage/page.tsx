'use client';

import { useState } from 'react';
import ThemeProvider from '@/app/components/ThemeProvider';
import useAuth from '@/app/hooks/useAuth';
import ClassModal from '@/app/components/classficationmodal';
import CyberPunk from './cyberpunk';
import MiddleAge from './middleage';
import Galaxy from './galaxy';

export default function PlayPage() {
  /*대분류 제목 선택 */
  const [selectMainTitle, setSelcetMainTitle] = useState('');

  /*다크모드 프롭스*/
  const [isDarkMode, setIsDarkMode] = useState(false);

  /*헤더프롭스 */
  const {
    connectWallet,
    registerWalletAddress,
    logout,
    signer,
    walletExist,
    isLoading,
  } = useAuth();

  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  const handleMainTitle = (choice: string) => {
    setSelcetMainTitle(choice);
  };

  return (
    /*다크모트 */
    <ThemeProvider>
      <div className="flex justify-center pt-11 text-4xl font-bold">
        <h1>Where to adventure?</h1>
      </div>

      <main className="flex flex-col m-20 mx-auto w-300 p-4 rounded-lg shadow-lg font-bold h-screen ">
        {/* 게임 종류 선택 */}
        <div className="flex  flex-row gap-4">
          {/* Session 모달 */}
          <ClassModal
            trigger={
              <button className="MST ml-30 mr-65 drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.3)]">
                Classfication
              </button>
            }
            isDarkMode={isDarkMode}
            position="left-110 mt-2"
          >
            <p>Choose a Genre and a World</p>
          </ClassModal>

          {/* Genre 모달 */}
          <ClassModal
            trigger={
              <button className="MST mr-80 drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.3)]">
                Genre
              </button>
            }
            isDarkMode={isDarkMode}
            position="left-217 mt-2"
          >
            <div className="flex flex-col justify-center items-center  gap-4  border-b border-sky-100">
              <div className="hover:bg-gray-100 rounded-2xl px-4">
                <button
                  className="cursor-pointer"
                  onClick={() => handleMainTitle('The Middle Ages')}
                >
                  Middle Ages
                </button>
              </div>
              <div className="hover:bg-gray-100 rounded-2xl px-4">
                <button
                  className="cursor-pointer"
                  onClick={() => handleMainTitle('Cyberpunk')}
                >
                  Cyberpunk
                </button>
              </div>
              <div className="hover:bg-gray-100 rounded-2xl px-4">
                <button
                  className="cursor-pointer"
                  onClick={() => handleMainTitle('Galaxy')}
                >
                  Galaxy
                </button>
              </div>
            </div>
          </ClassModal>

          {selectMainTitle === 'The Middle Ages' && (
            <>
              {/* World 모달 */}
              <ClassModal
                trigger={
                  <button className="MST drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.3)]">
                    World
                  </button>
                }
                isDarkMode={isDarkMode}
                position="right-120 mt-2"
              >
                <div className="flex flex-col justify-center items-center  gap-4  border-b border-gray-100">
                  <div className="hover:bg-gray-100 rounded-2xl px-4">
                    <button className="cursor-pointer">Everine</button>
                  </div>
                  <div className="hover:bg-gray-100 rounded-2xl px-4">
                    <button className="cursor-pointer">Silla</button>
                  </div>
                  <div className="hover:bg-gray-100 rounded-2xl px-4">
                    <button className="cursor-pointer">Cairo</button>
                  </div>
                </div>
              </ClassModal>
            </>
          )}
        </div>

        {/* Genre 섹션 */}
        <div className=" border-gray-100 flex flex-col items-center justify-center p-4 mt-20">
          <h1 className="text-4xl font-bold">
            {selectMainTitle ? selectMainTitle : 'Choose a Genre and a World'}
          </h1>
        </div>

        {selectMainTitle === 'The Middle Ages' && <MiddleAge />}

        {selectMainTitle === 'Cyberpunk' && <CyberPunk />}
        {selectMainTitle === 'Galaxy' && <Galaxy />}
      </main>
    </ThemeProvider>
  );
}
