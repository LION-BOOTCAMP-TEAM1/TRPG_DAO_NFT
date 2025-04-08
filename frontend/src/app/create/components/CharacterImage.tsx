import Image from 'next/image';
import { useState, useEffect } from 'react';

// 클래스 ID와 이름 매핑 - 존재하는 파일명으로 매핑
const classNameMapping: { [key: number]: string } = {
  1: 'magician',
  2: 'assassin',
  3: 'bard',
  4: 'ranger',
  5: 'warrior',
};

/*classId를 props로 받기 */
export default function CharacterImage({ classId, className }: { classId?: number, className?: string }) {
  const [imageError, setImageError] = useState(false);
  const [imagePath, setImagePath] = useState<string | null>(null);

  useEffect(() => {
    // 이미지 경로 설정 - ID 기반
    if (classId !== undefined && classNameMapping[classId]) {
      setImagePath(`/character/${classNameMapping[classId]}.png`);
      return;
    }
    
    // 클래스 이름 기반 - 대소문자 구분 없이
    if (className) {
      const lowerClassName = className.toLowerCase();
      
      // 직접 매핑
      const nameMapping: { [key: string]: string } = {
        'mage': 'magician',
        'magician': 'magician',
        'warrior': 'warrior',
        'assassin': 'assassin',
        'ranger': 'ranger',
        'bard': 'bard',
      };
      
      // 매핑된 이름이 있으면 사용, 없으면 warrior 기본값
      for (const [key, value] of Object.entries(nameMapping)) {
        if (lowerClassName.includes(key)) {
          setImagePath(`/character/${value}.png`);
          return;
        }
      }
      
      // 매핑된 이름이 없으면 warrior 기본값
      setImagePath('/character/warrior.png');
      return;
    }
    
    // 둘 다 없으면 기본값 설정
    setImagePath('/character/warrior.png');
  }, [classId, className]);

  // 이미지 로드 실패 또는 이미지 경로가 없는 경우
  if (imageError || !imagePath) {
    return null;
  }

  return (
    <Image
      src={imagePath}
      alt={className || "캐릭터"}
      width={200}
      height={200}
      className="max-w-full"
      onError={() => setImageError(true)}
      priority
    />
  );
}
