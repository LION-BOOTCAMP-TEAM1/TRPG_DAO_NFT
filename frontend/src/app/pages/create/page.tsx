'use client';

import CharacterClassSelection from './components/characterClassSelection';

import CharacterDetails from './components/characterDetails';
import CharacterText from './components/CharacterText';
import Message from './components/Message';
import useCharacterData from './hook/useCharacterData';

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
  } = useCharacterData();

  //프론트 뿌리기
  return (
    <div className="flex flex-col items-center min-h-screen bg-[#f4efe1]">
      <div
        className="text-6xl pt-10 drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,1)] mt-20"
        style={{ fontFamily: 'continuous' }}
      >
        <h1>New Adventure</h1>
      </div>

      <div className="text-2xl pb-2 pt-10 font-bold text-[#3e2d1c]">클래스</div>

      {/* 캐릭터 선택 */}
      <CharacterClassSelection
        characterClasses={characterClasses}
        selectedClass={selectedClass}
        setSelectedClass={setSelectedClass}
        isCreated={isCreated}
      />

      {/* 선택된 클래스 정보 및 캐릭터 생성 입력 폼 */}
      {selectedClass && (
        <div className="flex flex-row">
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
  );
}
