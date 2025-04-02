"use client";

import { motion, AnimatePresence } from "framer-motion";
import React, { useEffect, useRef, useState } from "react";
import DamageText from "./DamageText";
import DiceRoller from "./DiceRoller";

const frameImages = [
  "/battle/dragon1.png",
  "/battle/dragon2.png",
  "/battle/dragon3.png",
  "/battle/dragon4.png",
];

function gaussianRandom(mean: number, stdDev: number = 10): number {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return Math.floor(z * stdDev + mean);
}

const dragon = {
  maxHP: 999,
  HP: 999,
  damage: 120,
  speed: 200,
}

interface BattleComponentProps {
  speed: number;
  onClose: (result: boolean) => void;
}

const BattleComponent = ({ speed = 500, onClose }: BattleComponentProps) => { 
  const [frameIndex, setFrameIndex] = useState(0);
  const [isAttacking, setIsAttacking] = useState(false);
  const [isMonsterAttacking, setIsMonsterAttacking] = useState(false);
  const [diceNumber, setDiceNumber] = useState<number | null>(null);
  
  const [isFighting, setIsFighting] = useState<boolean>(false);
  const myInterval = useRef<NodeJS.Timeout | null>(null);
  const monsterInterval = useRef<NodeJS.Timeout | null>(null);

  const [myDamage, setMyDamage] = useState<number>(0);
  const [monsterDamage, setMonsterDamage] = useState<number>(0);

  useEffect(() => {
    if (isMonsterAttacking) return; // 공격 중에는 애니메이션 정지
    const interval = setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % frameImages.length);
    }, speed);
    return () => clearInterval(interval);
  }, [speed, isMonsterAttacking]);

  const myAttack = () => {
    setIsAttacking(true);
    setTimeout(() => setIsAttacking(false), 1000);
  }

  const monsterAttack = () => {
    setIsMonsterAttacking(true);
    setTimeout(() => setIsMonsterAttacking(false), 1000);
    setMonsterDamage(gaussianRandom(dragon.damage));
  }

  const startBattle = () => {
    if (isFighting) return;
    setIsFighting(true);

    myInterval.current = setInterval(() => {
      myAttack();
    }, 2300);

    monsterInterval.current = setInterval(() => {
      monsterAttack();
    }, 5100);
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 bg-black bg-opacity-60 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
      >
        <motion.div
          className="bg-[#e5ddca] rounded-lg p-2 w-[768px] shadow-lg relative border-4 border-[#a2937e] flex flex-col items-center"
          onClick={(e) => e.stopPropagation()}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.5, opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <div className="w-[400px]">
            {/* 상단 상태바 (이름, 체력, 우세 등) */}
            <div className="flex justify-between items-center p-2 font-bold text-sm text-gray-800">
              <div>
                <div className="text-lg">게리메일</div>
                <div>🗡 27</div>
                <div className="bg-green-600 w-[120px] h-4 mt-1 relative">
                  <div className="absolute left-0 text-white text-xs pl-1">240/240</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg">드래곤</div>
                <div>🗡 {dragon.damage}</div>
                <div className="bg-red-600 w-[120px] h-4 mt-1 relative">
                  <div className="absolute right-0 text-white text-xs pr-1">{dragon.HP}/{dragon.maxHP}</div>
                </div>
              </div>
            </div>

            {/* 전투 배경 및 캐릭터 영역 */}
            <div className="relative w-[400px] h-[400px] bg-[url('/battle/map.png')] bg-cover bg-center border my-2">
              {/* 공격 이펙트 */}
              {isAttacking && <div>
                <img
                  src={"/battle/magic.png"}
                  alt="attack_effect"
                  className="absolute top-30 left-30 w-[120px] h-[120px]"
                />
                <DamageText damage={77} x={150} y={100} />
              </div>}
              {/* 도라곤 */}
              <img
                src={isMonsterAttacking
                  ? "/battle/dragon-attack.png" 
                  : frameImages[frameIndex]
                }
                alt="enemy"
                className="w-full h-full"
              />
              {isMonsterAttacking && <DamageText damage={monsterDamage} x={180} y={310} />}
            </div>
            {!diceNumber && <DiceRoller diceResult={(v) => setDiceNumber(v)}/>}
            {/* 하단 UI - 스킬 및 전투 시작 버튼 등 */}
            <div className="flex justify-between mt-4 ">
              {diceNumber 
              ? <button
                className="bg-[#4e4e4e] hover:bg-[#333333] px-4 py-2 rounded border border-gray-700 text-white font-bold"
                onClick={() => startBattle()}
              >
                ⚔️ 전투하기
              </button>
              : <div />
              }
              <button
                className="bg-[#ff1b1b] hover:bg-[#ff491be7] px-4 py-2 rounded border border-gray-700 text-white font-bold"
                onClick={() => onClose(false)}
              >
                포기하기
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default BattleComponent;
