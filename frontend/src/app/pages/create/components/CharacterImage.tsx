import Image from 'next/image';

/*classId 맵핑 후 이미지 경로로 출력*/
const classImages: { [key: number]: string } = {
  1: '/character/magician.png',
  2: '/character/assassin.png',
  3: '/character/bard.png',
  4: '/character/ranger.png',
  5: '/character/warrior.png',
};

/*classId를 props로 받기 */
export default function CharacterImage({ classId }: { classId: number }) {
  return (
    <Image
      src={classImages[classId] || '/character/default.png'}
      alt="character"
      width={200}
      height={200}
      className="absolute z-10 -mt-22"
    />
  );
}
