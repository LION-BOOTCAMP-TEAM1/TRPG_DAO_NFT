'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import BattleComponent from '@/app/components/battle/BattleComponent';

interface BattleHandlerProps {
  isSceneComplete: boolean;
  story: {
    quests?: any[];
    BranchPoint?: any[];
  };
  chapterSlug: string;
}

const BattleHandler = ({
  isSceneComplete,
  story,
  chapterSlug,
}: BattleHandlerProps) => {
  const [startBattle, setStartBattle] = useState(false);
  const [battleEnded, setBattleEnded] = useState(false);
  const [isVictory, setIsVictory] = useState(false);
  const router = useRouter();

  const shouldTriggerBattle =
    isSceneComplete &&
    (story?.quests?.length ?? 0) === 0 &&
    !story?.BranchPoint?.[0];

  if (!shouldTriggerBattle) return null;

  return (
    <div className="mt-8 flex flex-col items-center">
      {!startBattle && !battleEnded && (
        <button
          onClick={() => setStartBattle(true)}
          className="px-6 py-3 bg-red-700 text-white font-bold rounded-lg hover:bg-red-800 transition"
        >
          🐉 용과 싸우러 가기
        </button>
      )}

      {startBattle && !battleEnded && (
        <BattleComponent
          speed={500}
          onClose={(victory: boolean) => {
            setBattleEnded(true);
            setIsVictory(victory);
          }}
        />
      )}

      {battleEnded && (
        <div className="mt-6 flex flex-col items-center gap-4">
          {isVictory ? (
            <button
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700"
              onClick={() =>
                router.push(`/story/${chapterSlug}/ancient-power-revealed`)
              }
            >
              🎉 다음 이야기로 이동하기
            </button>
          ) : (
            <button
              className="bg-gray-800 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-700"
              onClick={() => {
                setStartBattle(false);
                setBattleEnded(false);
                setIsVictory(false);
              }}
            >
              💀 다시 도전하기
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default BattleHandler;
