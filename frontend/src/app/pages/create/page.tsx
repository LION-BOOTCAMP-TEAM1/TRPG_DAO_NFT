'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { GrRadialSelected } from 'react-icons/gr';
import { FaRegCircle } from 'react-icons/fa';
import Image from 'next/image';

export default function CreatePage() {
  const [characterClasses, setCharacterClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState<any | null>(null);
  const [characterName, setCharacterName] = useState('');
  const [gender, setGender] = useState('');
  const [age, setAge] = useState<number | ''>('');
  const [attribute, setAttribute] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  // 현재 로그인한 사용자의 ID (예제 - 실제 로그인 로직 필요)
  const userId = 5; // 예제 데이터

  // 클랙스 목록
  useEffect(() => {
    api
      .get('/api/characterclasses')
      .then((response) => setCharacterClasses(response.data))
      .catch((error) => console.error('Error fetching data:', error));
  }, []);

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
  const createCharacter = async () => {
    if (!selectedClass || !characterName) {
      setMessage('닉네임을 입력하세요.');
      return;
    }

    if (!/[a-zA-Z]/.test(characterName)) {
      setMessage('영문자를 포함하세요.');
      return;
    }

    try {
      const response = await api.post('/api/characters', {
        userId,
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

      if (response.status === 200 || response.status === 201) {
        setMessage('생성 완료.');
      } else {
        setMessage('생성 실패');
      }
    } catch (error) {
      console.error('Error creating character:', error);
      setMessage('서버 오류');
    }
  };

  useEffect(() => {
    setGender(
      selectedClass?.id === 1 || selectedClass?.id === 3 ? 'Female' : 'Male',
    );
    setAttribute('Undefined');
    setAge(10);
  }, [selectedClass]);

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
              className="absolute z-10 -mt-32"
            />
          )}
          {selectedClass.id == 2 && (
            <Image
              src={'/character/warrior.png'}
              alt="warrior"
              width={200}
              height={200}
              className="absolute z-10 -mt-32"
            />
          )}
          {selectedClass.id == 3 && (
            <Image
              src={'/character/bard.png'}
              alt="bard"
              width={200}
              height={200}
              className="absolute z-10 -mt-32"
            />
          )}
          {selectedClass.id == 4 && (
            <Image
              src={'/character/ranger.png'}
              alt="ranger"
              width={200}
              height={200}
              className="absolute z-10 -mt-32"
            />
          )}
          {selectedClass.id == 5 && (
            <Image
              src={'/character/assassin.png'}
              alt="rogue"
              width={200}
              height={200}
              className="absolute z-10 -mt-32"
            />
          )}
          {/* 캐릭터 정보 입력 */}
          <div>
            <p className="text-xl font-bold text-[#3e2d1c]">닉네임</p>
          </div>
          <div className="flex flex-row">
            <div className="mt-1 space-y-2 w-40 ">
              <input
                type="text"
                placeholder="캐릭터 이름"
                value={characterName}
                onChange={(e) => {
                  const inputValue = e.target.value.replace(/\s/g, ''); // 공백 제거
                  setCharacterName(inputValue); // 입력값 반영
                }}
                onBlur={() => {
                  if (!/[a-zA-Z]/.test(characterName)) {
                  }
                }}
                className="border p-2 w-full rounded bg-[#f5f1ec]"
              />
              {message && (
                <p className="mt-2  text-red-500 text-sm flex justify-center">
                  {message}
                </p>
              )}
            </div>
            <button className="">asd</button>
          </div>

          {/* 캐릭터 생성 버튼 */}
          <button
            className="mt-3 px-4 py-2 inline-block bg-[#1e40af] text-white text-sm rounded hover:bg-[#374fc9] transition-colors "
            onClick={createCharacter}
          >
            캐릭터 생성
          </button>
        </div>
      )}
    </div>
  );
}
