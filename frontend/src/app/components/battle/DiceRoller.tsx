import React, { useState } from 'react';

interface DiceRollerProps {
    diceResult: (value: number) => void;
  }
  

const DiceRoller = ({diceResult}: DiceRollerProps) => {
  const [number, setNumber] = useState<number | null>(null);
  const [rolling, setRolling] = useState<boolean>(false);

  const rollDice = () => {
    setRolling(true);
    setTimeout(() => {
      const randomNumber = Math.floor(Math.random() * 10) + 1;
      setNumber(randomNumber);
      setRolling(false);
    }, 500);
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="w-64 text-center shadow-xl">
        <div className="p-6">
            <div className="flex flex-row items-center">
                <div className="flex-1" /> {/* 왼쪽 여백 (비우기용) */}
                <h2 className="text-xl font-bold mb-4 text-center flex-2">🎲 주사위</h2>
                <div className="flex-1">
                    {number && (
                        <button
                        className="text-sm font-bold mb-4"
                        onClick={rollDice}
                        >
                        🔁
                        </button>
                    )}
                </div>
            </div>
            <div className="text-6xl font-mono mb-4">
                {rolling ? "..." : number ?? "-"}
            </div>
            {number
            ? <button
                className='bg-green-500 rounded-lg p-2 text-white hover:bg-green-600'
                onClick={() => diceResult(number)}
                disabled={rolling}
            >
                결정하기
            </button>
            : <button className={`bg-amber-600 rounded-lg p-2 text-white hover:bg-amber-700`} onClick={rollDice} disabled={rolling}>
                {rolling ? "굴리는 중..." : "주사위 굴리기"}
            </button>
            }
        </div>
      </div>
    </div>
  );
};

export default DiceRoller;
