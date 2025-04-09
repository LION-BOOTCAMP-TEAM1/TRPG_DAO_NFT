'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useThemeContext } from '../../providers/AppProvider';

interface CharacterClass {
  id: number;
  code: string;
  name: string;
  description: string;
  recommendedStat1: string;
  recommendedStat2: string;
}

interface Props {
  characterClasses: CharacterClass[];
  selectedClass: CharacterClass | null;
  setSelectedClass: (characterClass: CharacterClass) => void;
  isCreated: boolean;
  isLoading?: boolean;
}

export default function CharacterClassSelection({
  characterClasses,
  selectedClass,
  setSelectedClass,
  isCreated,
  isLoading = false,
}: Props) {
  const { isDarkMode } = useThemeContext();
  const [mounted, setMounted] = useState(false);
  
  // 클라이언트 사이드에서만 테마 정보에 접근
  useEffect(() => {
    setMounted(true);
  }, []);
  
  const isDark = mounted && isDarkMode;

  // 캐릭터 클래스 이름을 파일명으로 변환하는 함수
  const getCharacterImagePath = (className: string, classCode: string): string => {
    const classNameMap: { [key: string]: string } = {
      'Fighter': 'warrior',
      'Wizard': 'magician',
      'Rogue': 'assassin',
      'Ranger': 'ranger',
      'Bard': 'bard',
      // 다른 클래스 매핑이 필요하면 여기에 추가
    };

    // 클래스 이름에 대응되는 이미지 파일 이름 반환 (소문자화)
    const mappedName = classNameMap[className] || classCode;
    return `/character/${mappedName}.png`;
  };

  // 로딩 스켈레톤 컴포넌트
  const CharacterSkeleton = () => (
    <div className={`
      relative overflow-hidden rounded-md w-full max-w-[200px] aspect-square
      ${isDark ? 'bg-[#292420] border-2 border-[#634a2f]' : 'bg-[#f4e8d3] border-2 border-[#7a5c3d]'}
      animate-pulse
    `}>
      <div className="flex flex-col items-center justify-center h-full p-4">
        {/* 캐릭터 이미지 스켈레톤 */}
        <div className="mb-2 h-24 w-24 flex items-center justify-center">
          <div className={`
            relative flex items-center justify-center w-full h-full rounded-full 
            ${isDark ? 'bg-[#3d2e1a]' : 'bg-[#e0d4c0]'}
          `}></div>
        </div>
        
        {/* 클래스 이름 스켈레톤 */}
        <div className={`
          h-6 w-20 rounded
          ${isDark ? 'bg-[#3d2e1a]' : 'bg-[#e0d4c0]'}
        `}></div>
      </div>
    </div>
  );

  // 로딩 중이면 스켈레톤 표시
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 justify-items-center">
        {[...Array(5)].map((_, index) => (
          <CharacterSkeleton key={index} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 justify-items-center">
      {characterClasses.map((characterClass) => {
        const isSelected = selectedClass?.id === characterClass.id;
        const characterName = characterClass.name;
        const imagePath = getCharacterImagePath(characterName, characterClass.code);
        
        return (
          <div
            key={characterClass.id}
            className={`
              relative overflow-hidden rounded-md cursor-pointer w-full max-w-[200px] aspect-square
              text-center transition-all duration-300 
              ${isCreated ? 'opacity-50 pointer-events-none' : ''}
              ${isSelected 
                ? isDark 
                  ? 'bg-[#3d2e1a] border-4 border-[#8c6a47] shadow-[0_0_20px_rgba(140,106,71,0.4)]' 
                  : 'bg-[#f4e8d3] border-4 border-[#7a5c3d] shadow-[0_0_20px_rgba(122,92,61,0.4)]' 
                : isDark 
                  ? 'bg-[#292420] border-2 border-[#634a2f] hover:bg-[#3d2e1a] hover:border-[#8c6a47]' 
                  : 'bg-[#f4e8d3] border-2 border-[#7a5c3d] hover:bg-[#fff] hover:border-[#7a5c3d]'
              }
            `}
            onClick={() => !isCreated && setSelectedClass(characterClass)}
          >
            <div className={`
              flex flex-col items-center justify-center h-full p-4
              ${isSelected 
                ? isDark ? 'text-[#d7c4a7]' : 'text-[#3e2d1c]' 
                : isDark ? 'text-[#a89078]' : 'text-[#7a5c3d]'
              }
            `}>
              {/* 캐릭터 이미지 */}
              <div className="mb-2 h-24 w-24 flex items-center justify-center">
                <div className={`
                  relative flex items-center justify-center w-full h-full rounded-full 
                  overflow-hidden
                  ${isDark ? 'bg-[#33291f]' : 'bg-[#e5d9c5]'}
                `}>
                  <div className="relative w-full h-full flex items-center justify-center">
                    <Image
                      src={imagePath}
                      alt={characterName}
                      width={80}
                      height={80}
                      className="object-cover z-10"
                      onError={(e) => {
                        // 이미지 로드 실패 시 기본 스타일 적용
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                    {/* 이미지 로드 표시기 */}
                    <div className="absolute inset-0 flex items-center justify-center z-0">
                      <div className={`w-8 h-8 border-2 rounded-full animate-spin ${isDark ? 'border-[#8c6a47] border-t-transparent' : 'border-[#7a5c3d] border-t-transparent'}`}></div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* 클래스 이름 */}
              <div className={`
                text-lg font-bold 
                ${isSelected ? 'scale-110 transition-transform duration-300' : ''} 
                ${isDark ? 'text-[#d7c4a7]' : 'text-[#3e2d1c]'}
              `}>
                {characterName}
              </div>
            </div>
            
            {/* 선택 아이콘 */}
            {isSelected && (
              <div className={`
                absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center
                ${isDark ? 'bg-[#8c6a47]' : 'bg-[#7a5c3d]'}
              `}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} 
                  stroke={isDark ? '#d7c4a7' : '#fff'} className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
