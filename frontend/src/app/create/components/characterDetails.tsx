import CharacterImage from './CharacterImage';
import Link from 'next/link';
import UnloadHandler from '@/app/components/UnloadHandler';
import { setCharacterInfo } from '@/store/characterSlice';
import { AppDispatch } from "@/store";
import { useDispatch } from "react-redux";
import { useState, useEffect } from 'react';
import { useThemeContext } from '../../providers/AppProvider';

export default function CharacterDetails({
  selectedClass,
  characterName,
  setCharacterName,
  handleCreateCharacter,
  isCreated,
}: {
  selectedClass: any;
  characterName: string;
  setCharacterName: (name: string) => void;
  handleCreateCharacter: () => any | null;
  isCreated: boolean;
}) {  
  const dispatch = useDispatch<AppDispatch>();
  const { isDarkMode } = useThemeContext();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  const isDark = mounted && isDarkMode;

  const handleCreate = async () => {
    const character = await handleCreateCharacter();
    if(character) {
      dispatch(setCharacterInfo(character));
    }
  }

  return (
    <div className={`p-4 rounded ${isDark ? 'bg-[#292420]' : 'bg-[#f4efe1]'} max-w-md w-full`}>
      <UnloadHandler isBlocking />

      {/* 캐릭터 클래스 이름 */}
      <p className={`text-xl font-bold ${isDark ? 'text-[#e0d2c0]' : 'text-[#3a2921]'} text-center mb-3`}>
        {selectedClass?.name || selectedClass?.class_name}
      </p>

      {/* 캐릭터 이미지 */}
      <div className="flex justify-center mb-4">
        <div className="w-[200px] h-[200px] flex items-center justify-center">
          <CharacterImage 
            classId={selectedClass?.id} 
            className={selectedClass?.class_name} 
          />
        </div>
      </div>

      {/* 캐릭터 이름 입력 */}
      <div className="w-full mb-4">
        <p className={`text-center ${isDark ? 'text-[#d7c4a7]' : 'text-[#3e2d1c]'} mb-2`}>닉네임</p>
        
        <div className="flex justify-center">
          <div className="w-64">
            {isCreated ? (
              <div className={`p-2 text-center rounded ${
                isDark 
                  ? 'bg-[#33291f] text-[#d7c4a7]' 
                  : 'bg-[#e8e0ca] text-[#3a2921]'
              }`}>
                {characterName}
              </div>
            ) : (
              <input
                type="text"
                placeholder="캐릭터 이름"
                aria-label="캐릭터 이름"
                value={characterName}
                onChange={(e) => {
                  const inputValue = e.target.value.replace(/\s/g, '');
                  setCharacterName(inputValue);
                }}
                className={`p-2 w-full rounded text-center ${
                  isDark 
                    ? 'bg-[#33291f] text-[#d7c4a7] placeholder:text-[#8a7a6c]' 
                    : 'bg-[#e8e0ca] text-[#3a2921] placeholder:text-[#8c7a6a]'
                }`}
              />
            )}
          </div>
        </div>
      </div>

      {/* 생성 버튼 */}
      <div className="flex justify-center">
        {!isCreated ? (
          <button
            className={`px-4 py-2 rounded cursor-pointer ${
              isDark 
                ? 'bg-[#634a2f] text-[#e0d2c0] hover:bg-[#73583b]' 
                : 'bg-[#8c6e43] text-[#f4e8d3] hover:bg-[#9e7c4c]'
            }`}
            onClick={handleCreate}
          >
            캐릭터 생성
          </button>
        ) : (
          <Link href={'/story/1'}>
            <button className={`px-4 py-2 rounded cursor-pointer ${
              isDark 
                ? 'bg-[#5d3b15] text-[#e0d2c0] hover:bg-[#6d4519]' 
                : 'bg-[#7b4f1b] text-[#f4e8d3] hover:bg-[#8c5a1e]'
            }`}>
              모험 시작하기
            </button>
          </Link>
        )}
      </div>
    </div>
  );
}
