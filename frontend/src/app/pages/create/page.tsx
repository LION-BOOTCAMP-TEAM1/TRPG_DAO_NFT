'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { GrRadialSelected } from 'react-icons/gr';
import { FaRegCircle } from 'react-icons/fa';
import Image from 'next/image';
import useAuth from '@/app/hook/useAuth';
import Link from 'next/link';

export default function CreatePage() {
  const { user, createCharacter } = useAuth(); //유저 정보

  const [characterClasses, setCharacterClasses] = useState([]); //클래스 정보
  const [selectedClass, setSelectedClass] = useState<any | null>(null); //클래스 선택
  const [characterName, setCharacterName] = useState(''); //캐릭터 이름 입력
  const [characters, setCharacters] = useState([]); // 기존 캐릭터 목록
  const [gender, setGender] = useState('');
  const [age, setAge] = useState<number | ''>('');
  const [attribute, setAttribute] = useState('');

  const [message, setMessage] = useState<string | null>(null); // 오류

  const [isCreated, setIsCreated] = useState(false); //캐릭터 생성 여부

  // 클랙스 목록
  useEffect(() => {
    const fetchData = async () => {
      try {
        //promise.all 모든 api 동시처리
        const [classesResponse, charactersResponse] = await Promise.all([
          api.get('/api/characterclasses'),
          api.get('/api/characters'),
        ]);

        setCharacterClasses(classesResponse.data);
        setCharacters(charactersResponse.data);
      } catch (error) {
        console.error('데이터 가져오기 실패:', error);
      }
    };

    fetchData();
  }, []);

  //중복 체크
  const checkCharacterNameDuplicate = (name: string) => {
    return characters.some((char: any) => char.name === name);
  };

  //레벨1 클래스 스탯 고정
  const classStats = {
    1: {
      hp: 100,
      mp: 400,
      health: 10,
      strength: 2,
      agility: 2,
      intelligence: 10,
      wisdom: 8,
      charisma: 6,
    },
    2: {
      hp: 400,
      mp: 100,
      health: 40,
      strength: 10,
      agility: 5,
      intelligence: 3,
      wisdom: 4,
      charisma: 5,
    },
    3: {
      hp: 200,
      mp: 300,
      health: 20,
      strength: 4,
      agility: 4,
      intelligence: 8,
      wisdom: 6,
      charisma: 12,
    },
    4: {
      hp: 250,
      mp: 250,
      health: 25,
      strength: 5,
      agility: 8,
      intelligence: 5,
      wisdom: 4,
      charisma: 7,
    },
    5: {
      hp: 300,
      mp: 200,
      health: 30,
      strength: 6,
      agility: 10,
      intelligence: 4,
      wisdom: 5,
      charisma: 9,
    },
  };

  const stats = classStats[selectedClass?.id as keyof typeof classStats] || {};

  // 캐릭터 생성 요청
  const handleCreateCharacter = async () => {
    if (!selectedClass || !characterName) {
      setMessage('닉네임을 입력하세요.');
      return;
    }

    if (!/[a-zA-Z]/.test(characterName)) {
      setMessage('영문자를 포함하세요.');
      return;
    }

    if (!user) {
      setMessage('로그인 해주세요.');
      return;
    }

    if (checkCharacterNameDuplicate(characterName)) {
      setMessage('닉네임 중복.');
      return;
    }

    try {
      const response = await createCharacter({
        name: characterName,
        classId: selectedClass.id,
        gender,
        age: Number(age),
        attribute,
        hp: stats.hp ?? 100,
        mp: stats.mp ?? 50,
        health: stats.health ?? 10,
        strength: stats.strength ?? 10,
        agility: stats.agility ?? 10,
        intelligence: stats.intelligence ?? 10,
        wisdom: stats.wisdom ?? 10,
        charisma: stats.charisma ?? 10,
      });

      if (response) {
        setMessage('생성 완료.');
        setIsCreated(true);
      } else {
        setMessage('생성 실패');
      }
    } catch (error) {
      console.error('Error creating character:', error);
      setMessage('서버 오류');
    }
  };

  //유저가 설정 안해도 되는거 그냥 고정
  useEffect(() => {
    setGender(
      selectedClass?.id === 1 || selectedClass?.id === 3 ? 'Female' : 'Male',
    );
    setAttribute('All');
    setAge(10);
  }, [selectedClass]);

  //프론트 뿌리기
  return (
    <div className="flex flex-col items-center min-h-screen bg-[#f4efe1]">
      <div
        className="text-6xl pt-10 drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,1)]"
        style={{ fontFamily: 'continuous' }}
      >
        <h1>New Adventure</h1>
      </div>

      <div className="text-2xl pb-2 pt-10 font-bold text-[#3e2d1c]">클래스</div>

      <div className="mt-4 ">
        {characterClasses.length > 0 ? (
          <ul className="space-y-2 flex flex-row gap-10 ">
            {characterClasses.map((charClass: any) => (
              <li
                key={charClass.id}
                className=" px-2 mb-10 rounded shadow justify-between items-center  "
              >
                <button
                  className={` ${
                    selectedClass?.id === charClass.id
                  }  rounded-3xl hover:bg-green-300 `}
                  onClick={() => setSelectedClass(charClass)}
                  disabled={isCreated}
                >
                  {selectedClass?.id === charClass.id ? (
                    <div>
                      <GrRadialSelected />
                    </div>
                  ) : (
                    <FaRegCircle />
                  )}
                </button>
                <span className="text-lg pl-2 ">{charClass.name}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p>Loding...</p>
        )}
      </div>

      {/* 선택된 클래스 정보 및 캐릭터 생성 입력 폼 */}
      {selectedClass && (
        <div className=" rounded shadow flex flex-col justify-center items-center">
          <p className="text-2xl  font-bold">{selectedClass.name}</p>
          <Image
            src={'/border.png'}
            alt="border"
            width={280}
            height={280}
            className="z-0 sm:w-[280] h-[auto] property"
          />
          {selectedClass.id == 1 && (
            <Image
              src={'/character/magician.png'}
              alt="magician"
              width={200}
              height={200}
              className="absolute z-10 -mt-22"
            />
          )}
          {selectedClass.id == 5 && (
            <Image
              src={'/character/warrior.png'}
              alt="warrior"
              width={200}
              height={200}
              className="absolute z-10 -mt-22"
            />
          )}
          {selectedClass.id == 3 && (
            <Image
              src={'/character/bard.png'}
              alt="bard"
              width={200}
              height={200}
              className="absolute z-10 -mt-22"
            />
          )}
          {selectedClass.id == 4 && (
            <Image
              src={'/character/ranger.png'}
              alt="ranger"
              width={200}
              height={200}
              className="absolute z-10 -mt-22"
            />
          )}
          {selectedClass.id == 2 && (
            <Image
              src={'/character/assassin.png'}
              alt="rogue"
              width={200}
              height={200}
              className="absolute z-10 -mt-22"
            />
          )}

          {/* 캐릭터 정보 입력 */}
          <div>
            <p className="text-xl font-bold text-[#3e2d1c]">닉네임</p>
          </div>
          <div className="flex flex-row">
            <div className="mt-1 space-y-2 w-40 ">
              {isCreated ? (
                <p className="p-2 w-full  text-center">{characterName}</p>
              ) : (
                <input
                  type="text"
                  placeholder="캐릭터 이름"
                  value={characterName}
                  onChange={(e) => {
                    const inputValue = e.target.value.replace(/\s/g, '');
                    setCharacterName(inputValue);
                  }}
                  onBlur={() => {
                    if (!/[a-zA-Z]/.test(characterName)) {
                    }
                  }}
                  className="border p-2 w-full rounded bg-[#f5f1ec]"
                />
              )}
            </div>
          </div>

          {/* 캐릭터 생성 버튼 */}
          {!isCreated ? (
            <button
              className="mt-3 px-4 py-2 inline-block bg-[#1e40af] text-white text-sm rounded hover:bg-[#374fc9] transition-colors "
              onClick={handleCreateCharacter}
            >
              캐릭터 생성
            </button>
          ) : (
            <Link
              href={'/story/1'}
              className="mt-3 px-4 py-2 inline-block bg-[#1e40af] text-white text-sm rounded hover:bg-[#374fc9] transition-colors "
            >
              시작하기
            </Link>
          )}
        </div>
      )}

      {/* 생성 완료 메세지 */}
      <div>
        {!isCreated && message && (
          <p className="mt-2  text-red-500 text-sm flex justify-center">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
