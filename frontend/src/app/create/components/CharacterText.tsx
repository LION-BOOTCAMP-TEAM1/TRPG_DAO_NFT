import { classStats } from './CharacterStats';

export default function CharacterDescription({
  selectedClass,
}: {
  selectedClass: any;
}) {
  const stats =
    classStats[Number(selectedClass?.id) as keyof typeof classStats];

  if (!stats) {
    return <p className="text-red-500">스탯 정보를 불러올 수 없습니다.</p>;
  }

  return (
    <div className="rounded shadow p-4 mt-4 w-full max-w-sm">
      {
        <p className="text-md mb-4 text-[#3e2d1c] text-center">
          {selectedClass.description}
        </p>
      }

      <div className="flex flex-col gap-2 text-sm text-gray-800">
        <div>🔴 HP: {stats.hp}</div>
        <div>🔵 MT: {stats.mp}</div>
        <div>❤️ Health: {stats.health}</div>
        <div>💪 Strength: {stats.strength}</div>
        <div>🏃 Agility: {stats.agility}</div>
        <div>🧠 Intelligence: {stats.intelligence}</div>
        <div>📘 Wisdom: {stats.wisdom}</div>
        <div>😎 Charisma: {stats.charisma}</div>
        <div>⚔️ Physical Attack: {stats.physicalAttack}</div>
        <div>✨ Magic Attack: {stats.magicAttack}</div>
      </div>
    </div>
  );
}
