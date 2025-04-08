import Image from 'next/image';
import CharacterImage from './CharacterImage';
import Link from 'next/link';
import UnloadHandler from '@/app/components/UnloadHandler';
import { setCharacterInfo } from '@/store/characterSlice';
import { AppDispatch } from "@/store";
import { useDispatch } from "react-redux";

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

  const handleCreate = async () => {
    const character = await handleCreateCharacter();
    if(character) {
      dispatch(setCharacterInfo(character));
    }
  }

  return (
    <div className="rounded shadow flex flex-col justify-center items-center">
      <p className="text-2xl font-bold">{selectedClass.name}</p>
      <UnloadHandler isBlocking />

      {/* 배경 테두리 */}
      <Image
        src={'/border.png'}
        alt="border"
        width={280}
        height={280}
        className="z-0 sm:w-[280px] h-auto"
      />

      {/* 캐릭터 이미지 */}
      <CharacterImage classId={selectedClass.id} />

      {/* 캐릭터 이름 입력 */}
      <div>
        <p className="text-xl font-bold text-[#3e2d1c]">닉네임</p>
      </div>

      <div className="flex flex-row">
        <div className="mt-1 space-y-2 w-40 ">
          {isCreated ? (
            <p className="p-2 w-full text-center">{characterName}</p>
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
              className="border p-2 w-full rounded bg-[#f5f1ec]"
            />
          )}
        </div>
      </div>

      {/* 생성 버튼 */}
      {!isCreated ? (
        <button
          className="mt-3 px-4 py-2 inline-block bg-[#1e40af] text-white text-sm rounded hover:bg-[#374fc9] transition-colors"
          onClick={handleCreate}
        >
          캐릭터 생성
        </button>
      ) : (
        <Link href={'/story/1'}>
          <button className="mt-3 px-4 py-2 bg-[#1e40af] text-white text-sm rounded">
            시작하기
          </button>
        </Link>
      )}
    </div>
  );
}
