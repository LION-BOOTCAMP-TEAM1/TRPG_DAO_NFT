import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import useAuth from '@/app/hooks/useAuth';
import { classStats } from '../components/CharacterStats';

export default function useCharacterData() {
  const { user, createCharacter } = useAuth();

  const [characterClasses, setCharacterClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState<any | null>(null);
  const [characterName, setCharacterName] = useState('');
  const [characters, setCharacters] = useState([]);
  const [gender, setGender] = useState('');
  const [age, setAge] = useState<number | ''>('');
  const [attribute, setAttribute] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [isCreated, setIsCreated] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
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

  const checkCharacterNameDuplicate = (name: string) => {
    return characters.some((char: any) => char.name === name);
  };

  useEffect(() => {
    setGender(
      selectedClass?.id === 1 || selectedClass?.id === 3 ? 'Female' : 'Male',
    );
    setAttribute('All');
    setAge(10);
  }, [selectedClass]);

  const handleCreateCharacter = async () => {
    if (!selectedClass || !characterName) {
      setMessage('닉네임을 입력하세요.');
      return null;
    }

    if (/^[ㄱ-ㅎㅏ-ㅣ]+$/.test(characterName)) {
      setMessage('완성된 글자를 입력해주세요.');
      return null;
    }

    if (!user) {
      setMessage('로그인 해주세요.');
      return null;
    }

    if (checkCharacterNameDuplicate(characterName)) {
      setMessage('닉네임 중복.');
      return null;
    }

    const stats = selectedClass?.id
      ? classStats[selectedClass.id as keyof typeof classStats]
      : {};

    try {
      const response = await createCharacter({
        name: characterName,
        classId: selectedClass.id,
        gender,
        age: Number(age),
        attribute,
        ...stats,
      });

      if (response) {
        setMessage('생성 완료.');
        setIsCreated(true);
        return {
          name: characterName,
          class: characterClasses.find((c: any) => c.id === selectedClass.id),
          gender,
          age: Number(age),
          attribute,
          ...stats,
        };
      } else {
        setMessage('생성 실패');
        return null;
      }
    } catch (error) {
      console.error('Error creating character:', error);
      setMessage('서버 오류');
      return null;
    }
  };

  return {
    characterClasses,
    selectedClass,
    setSelectedClass,
    characterName,
    setCharacterName,
    handleCreateCharacter,
    isCreated,
    message,
  };
}
