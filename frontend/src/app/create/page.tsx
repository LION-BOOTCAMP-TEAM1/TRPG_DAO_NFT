'use client';

import CharacterClassSelection from './components/characterClassSelection';
import CharacterDetails from './components/characterDetails';
import CharacterText from './components/CharacterText';
import Message from './components/Message';
import useCharacterData from './hook/useCharacterData';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useThemeContext } from '../providers/AppProvider';
import TransactionLoadingModal from '../story/[chapterSlug]/[storySlug]/components/TransactionLoadingModal';

// 단순화된 이미지 컴포넌트
const SafeImage = ({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  priority?: boolean;
}) => {
  const [error, setError] = useState(false);

  if (error) {
    return null; // 이미지 로드 실패 시 아무것도 렌더링하지 않음
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      onError={() => setError(true)}
      priority={priority}
    />
  );
};

export default function CreatePage() {
  const {
    characterClasses,
    selectedClass,
    setSelectedClass,
    characterName,
    setCharacterName,
    handleCreateCharacter,
    isCreated,
    message,
    isLoading,
  } = useCharacterData();

  const { isDarkMode } = useThemeContext();
  const [mounted, setMounted] = useState(false);

  // 클라이언트 사이드에서만 테마 정보에 접근
  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && isDarkMode;

  //프론트 뿌리기
  return (
    <div
      className={`flex flex-col items-center min-h-screen 
      ${
        isDark
          ? 'bg-gradient-to-b from-[#292420] to-[#1a1613] dark:bg-[#1a1613]'
          : 'bg-gradient-to-b from-[#f4efe1] to-[#e8e0ca]'
      } 
      bg-cover relative transition-colors duration-300`}
    >
      <div
        className={`text-5xl pt-24 mb-8 ${isDark ? 'text-[#e0d2c0]' : 'text-[#3a2921]'} relative z-10 font-bold`}
        style={{
          textShadow: isDark
            ? '2px 2px 4px rgba(0,0,0,0.6)'
            : '2px 2px 4px rgba(0,0,0,0.3)',
        }}
      >
        캐릭터 생성
      </div>

      {/* 디자인 요소: 양피지 프레임 */}
      <div
        className={`relative z-10 w-4/5 max-w-5xl 
        ${
          isDark
            ? 'bg-[rgba(40,35,30,0.85)] border-4 border-[#634a2f]'
            : 'bg-[rgba(244,232,211,0.7)] border-4 border-[#7a5c3d]'
        } 
        rounded-lg p-8 shadow-[0_0_15px_rgba(0,0,0,0.3)] mb-10 transition-colors duration-300`}
      >
        {/* 캐릭터 선택 */}
        <CharacterClassSelection
          characterClasses={characterClasses}
          selectedClass={selectedClass}
          setSelectedClass={setSelectedClass}
          isCreated={isCreated}
          isLoading={isLoading}
        />

        {/* 선택된 클래스 정보 및 캐릭터 생성 입력 폼 */}
        {selectedClass && !isLoading && (
          <div className="flex flex-col md:flex-row gap-8 justify-center mt-6">
            <CharacterDetails
              selectedClass={selectedClass}
              characterName={characterName}
              setCharacterName={setCharacterName}
              handleCreateCharacter={handleCreateCharacter}
              isCreated={isCreated}
            />
            <CharacterText selectedClass={selectedClass} />
          </div>
        )}

        {/* 하단 메세지 */}
        {!isCreated && <Message message={message} />}
      </div>

      {/* 로딩 모달 추가 */}
      <TransactionLoadingModal isOpen={isLoading} message="캐릭터 생성 중..." />
    </div>
  );
}
