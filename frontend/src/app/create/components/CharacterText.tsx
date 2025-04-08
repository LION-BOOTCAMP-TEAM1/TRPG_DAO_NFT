import { classStats } from './CharacterStats';
import { useState, useEffect } from 'react';
import { useThemeContext } from '../../providers/AppProvider';
import Image from 'next/image';

export default function CharacterDescription({
  selectedClass,
}: {
  selectedClass: any;
}) {
  // Check if selectedClass has an id before trying to access it
  const classId =
    selectedClass?.id !== undefined ? Number(selectedClass.id) : -1;
  const stats =
    classId >= 0 ? classStats[classId as keyof typeof classStats] : null;

  const { isDarkMode } = useThemeContext();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && isDarkMode;

  if (!stats) {
    return (
      <p className={`${isDark ? 'text-red-400' : 'text-red-500'}`}>
        스탯 정보를 불러올 수 없습니다.
      </p>
    );
  }

  return (
    <div
      className={`p-4 rounded ${isDark ? 'bg-[#292420]' : 'bg-[#f4efe1]'} max-w-md w-full`}
    >
      {/* 클래스 설명 */}
      <div>
        <h3
          className={`text-xl text-center ${
            isDark ? 'text-[#e0d2c0]' : 'text-[#3a2921]'
          } mb-3`}
        >
          클래스 소개
        </h3>
        <div
          className={`${
            isDark ? 'bg-[#33291f]' : 'bg-[#e8e0ca]'
          } p-2 rounded mb-4 text-center`}
        >
          <p
            className={`italic ${isDark ? 'text-[#d7c4a7]' : 'text-[#3e2d1c]'}`}
          >
            {selectedClass?.description ||
              '이 영웅에 대한 전설은 아직 기록되지 않았다...'}
          </p>
        </div>
      </div>

      {/* 스탯 정보 */}
      <div>
        <h3
          className={`text-xl text-center ${
            isDark ? 'text-[#e0d2c0]' : 'text-[#3a2921]'
          } mb-3`}
        >
          스탯 정보
        </h3>

        <div className="grid grid-cols-2 gap-3">
          <div
            className={`${
              isDark ? 'bg-[#33291f]' : 'bg-[#e8e0ca]'
            } p-3 rounded`}
          >
            <div
              className={`flex flex-col gap-2 ${
                isDark ? 'text-[#d7c4a7]' : 'text-[#3e2d1c]'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 flex items-center justify-center">
                  ❤️
                </div>
                <span className="flex-1">HP</span>
                <span className="font-bold">{stats.hp}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 flex items-center justify-center">
                  🔮
                </div>
                <span className="flex-1">MT</span>
                <span className="font-bold">{stats.mp}</span>
              </div>
              <div className="flex items-center gap-2">
                <Image
                  src="/stat-icons/health.png"
                  alt="Health"
                  width={16}
                  height={16}
                />
                <span className="flex-1">Health</span>
                <span className="font-bold">{stats.health}</span>
              </div>
              <div className="flex items-center gap-2">
                <Image
                  src="/stat-icons/str.png"
                  alt="Strength"
                  width={16}
                  height={16}
                />
                <span className="flex-1">Strength</span>
                <span className="font-bold">{stats.strength}</span>
              </div>
              <div className="flex items-center gap-2">
                <Image
                  src="/stat-icons/agi.png"
                  alt="Agility"
                  width={16}
                  height={16}
                />
                <span className="flex-1">Agility</span>
                <span className="font-bold">{stats.agility}</span>
              </div>
            </div>
          </div>

          <div
            className={`${
              isDark ? 'bg-[#33291f]' : 'bg-[#e8e0ca]'
            } p-3 rounded`}
          >
            <div
              className={`flex flex-col gap-2 ${
                isDark ? 'text-[#d7c4a7]' : 'text-[#3e2d1c]'
              }`}
            >
              <div className="flex items-center gap-2">
                <Image
                  src="/stat-icons/int.png"
                  alt="Intelligence"
                  width={16}
                  height={16}
                />
                <span className="flex-1">Intelligence</span>
                <span className="font-bold">{stats.intelligence}</span>
              </div>
              <div className="flex items-center gap-2">
                <Image
                  src="/stat-icons/wis.png"
                  alt="Wisdom"
                  width={16}
                  height={16}
                />
                <span className="flex-1">Wisdom</span>
                <span className="font-bold">{stats.wisdom}</span>
              </div>
              <div className="flex items-center gap-2">
                <Image
                  src="/stat-icons/chr.png"
                  alt="Charisma"
                  width={16}
                  height={16}
                />
                <span className="flex-1">Charisma</span>
                <span className="font-bold">{stats.charisma}</span>
              </div>
              <div className="flex items-center gap-2">
                <Image
                  src="/stat-icons/attack.png"
                  alt="Attack"
                  width={16}
                  height={16}
                />
                <span className="flex-1">Attack</span>
                <span className="font-bold">{stats.physicalAttack}</span>
              </div>
              <div className="flex items-center gap-2">
                <Image
                  src="/stat-icons/magic.png"
                  alt="Magic"
                  width={16}
                  height={16}
                />
                <span className="flex-1">Magic</span>
                <span className="font-bold">{stats.magicAttack}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
