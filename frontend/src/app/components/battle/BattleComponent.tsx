"use client";

import { motion, AnimatePresence } from "framer-motion";
import React, { useEffect, useRef, useState } from "react";
import DamageText from "./DamageText";
import DiceRoller from "./DiceRoller";
import { RootState } from "@/store";
import { useSelector } from "react-redux";
  
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

interface BattleComponentProps {
  speed: number;
  onClose: (result: boolean) => void;
}

const BattleComponent = ({ speed = 500, onClose }: BattleComponentProps) => { 
  // Redux에서 캐릭터 가져오기
  const myCharacter = useSelector((state: RootState) => state.character);

  const [frameIndex, setFrameIndex] = useState(0);
  const [isAttacking, setIsAttacking] = useState(false);
  const [isMonsterAttacking, setIsMonsterAttacking] = useState(false);
  const [diceNumber, setDiceNumber] = useState<number | null>(null);
  
  const [battleSpeed, setBattleSpeed] = useState(1);
  const [isFighting, setIsFighting] = useState<boolean>(false);
  const myInterval = useRef<NodeJS.Timeout | null>(null);
  const monsterInterval = useRef<NodeJS.Timeout | null>(null);

  const [myDamage, setMyDamage] = useState<number>(0);
  const [monsterDamage, setMonsterDamage] = useState<number>(0);

  const [dragon, setDragon] = useState({
    maxHP: 3000,
    HP: 3000,
    damage: 300,
    speed: 213,
  });

  const [character, setCharacter] = useState({
    maxHP: 300,
    HP: 300,
    damage: 77,
    speed: 442,
    HP_buf: 0,
    damage_buf: 0,
    speed_buf: 0,
  });

  const [showResultModal, setShowResultModal] = useState(false);
  const [resultMessage, setResultMessage] = useState("");
  const [isGameOver, setIsGameOver] = useState(false); // 중복 방지용

  useEffect(() => {
    if (!myCharacter) return;

    setCharacter({
      maxHP: myCharacter.stats.health * 50 + myCharacter.stats.strength * 20,
      HP: myCharacter.stats.health * 50 + myCharacter.stats.strength * 20,
      damage: Math.floor((myCharacter.stats.attack * myCharacter.stats.strength + myCharacter.stats.magic * myCharacter.stats.intelligence) / 10),
      speed: myCharacter.stats.agility * 50 + myCharacter.stats.wisdom * 10 + myCharacter.stats.charisma * 10,
      HP_buf: 0,
      damage_buf: 0,
      speed_buf: 0,
    });

  }, [myCharacter]);

  useEffect(() => {
    if(!diceNumber) return;

    setCharacter(prev => {
      const HP_buf = Math.floor(prev.maxHP * diceNumber / 10);
      const damage_buf = Math.floor(prev.damage * diceNumber / 10);
      const speed_buf = Math.floor(prev.speed * diceNumber / 100);
      return { ...prev, HP: prev.maxHP + HP_buf, HP_buf: HP_buf, damage_buf: damage_buf, speed_buf: speed_buf};
    });
  }, [diceNumber])

  useEffect(() => {
    if (isMonsterAttacking) return; // 공격 중에는 애니메이션 정지
    const interval = setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % frameImages.length);
    }, speed / battleSpeed);
    return () => clearInterval(interval);
  }, [speed, isMonsterAttacking]);

  const changeSpeed = () => {
    if(battleSpeed === 3) setBattleSpeed(1);
    else setBattleSpeed(battleSpeed + 1);
  }

  useEffect(() => {
    if (isGameOver) return;

    if(character.HP === 0 || dragon.HP === 0) {
      setIsGameOver(true);
      stopBattle();

      if (dragon.HP === 0) {
        setResultMessage("🎉 You Win!!");
      } else {
        setResultMessage("💀 Game Over!!");
      }

      setShowResultModal(true); // 모달 띄우기
    }
  }, [character.HP, dragon.HP])
  
  const myAttack = () => {
    setIsAttacking(true);
    setTimeout(() => setIsAttacking(false), 1000 / battleSpeed);
    const damage = gaussianRandom(character.damage + character.damage_buf);
    setMyDamage(damage);
    setDragon(prev => {
      const newHP = Math.max(prev.HP - damage, 0);
      return { ...prev, HP: newHP };
    });
  }

  const monsterAttack = () => {
    setIsMonsterAttacking(true);
    setTimeout(() => setIsMonsterAttacking(false), 1000 / battleSpeed);
    const damage = gaussianRandom(dragon.damage);
    setMonsterDamage(damage);
    setCharacter(prev => {
      const newHP = Math.max(prev.HP - damage, 0);
      return { ...prev, HP: newHP };
    });
  }

  const startBattle = () => {
    if (isFighting) return;
    setIsFighting(true);

    myInterval.current = setInterval(() => {
      myAttack();
    }, 1000000 / (character.speed + character.speed_buf) / battleSpeed);

    monsterInterval.current = setInterval(() => {
      monsterAttack();
    }, 1000000 / dragon.speed / battleSpeed);
  };

  const stopBattle = () => {
    setIsFighting(false);
  
    if (myInterval.current) {
      clearInterval(myInterval.current);
      myInterval.current = null;
    }
  
    if (monsterInterval.current) {
      clearInterval(monsterInterval.current);
      monsterInterval.current = null;
    }
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
                <p>
                  🗡️ {character.damage + character.damage_buf}
                  <span className="text-red-600"> (+{character.damage_buf})</span>
                </p>
                <p>
                  ⏳ {character.speed + character.speed_buf}
                  <span className="text-blue-600"> (+{character.speed_buf})</span>
                </p>
                <div className="w-[180px] mt-1 relative">
                  {/* 배경 바 */}
                  <div className="bg-gray-700 w-full h-4 rounded overflow-hidden">
                    {/* 체력 바 */}
                    <div
                      className="bg-green-500 h-full transition-all duration-300"
                      style={{
                        width: `${(character.HP / (character.maxHP + character.HP_buf)) * 100}%`,
                      }}
                    ></div>
                  </div>

                  {/* 숫자 표시 */}
                  <p className="absolute top-0 left-1 text-white text-xs">
                    {character.HP}/{character.maxHP + character.HP_buf}
                    <span className="text-gray-400"> (+{character.HP_buf})</span>
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg">드래곤</div>
                <div>🗡️ {dragon.damage}</div>
                <div>⏳ {dragon.speed}</div>
                <div className="w-[180px] mt-1 relative">
                  {/* 배경 바 */}
                  <div className="bg-gray-700 w-full h-4 rounded overflow-hidden">
                    {/* 체력 바 */}
                    <div
                      className="bg-red-600 h-full transition-all duration-300 absolute top-0 right-0"
                      style={{
                        width: `${Math.max((dragon.HP / dragon.maxHP) * 100, 0)}%`,
                      }}
                    ></div>
                  </div>

                  {/* 숫자 표시 (오른쪽 정렬) */}
                  <div className="absolute top-0 right-1 text-white text-xs">
                    {dragon.HP}/{dragon.maxHP}
                  </div>
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
                <DamageText damage={myDamage} x={150} y={100} />
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
              {diceNumber && !isFighting
              ? <div className="flex flex-row">
                <button
                  className="bg-[#4e4e4e] hover:bg-[#333333] px-4 py-2 rounded border border-gray-700 text-white font-bold cursor-pointer"
                  onClick={() => startBattle()}
                >
                  ⚔️ 전투하기
                </button>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={changeSpeed}
                    className={`px-3 py-1 rounded font-bold bg-gray-200 text-gray-800 cursor-pointer`}
                  >
                    x{battleSpeed}
                  </button>
                </div>
              </div>
              : <div />
              }
              <button
                className="bg-[#ff1b1b] hover:bg-[#ff491be7] px-4 py-2 rounded border border-gray-700 text-white font-bold cursor-pointer"
                onClick={() => onClose(false)}
              >
                포기하기
              </button>
            </div>

            {showResultModal && (
              <div className="fixed inset-0 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 shadow-lg text-center w-64">
                  <h2 className="text-lg font-bold mb-4">{resultMessage}</h2>
                  <button
                    className="mt-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded cursor-pointer"
                    onClick={() => onClose(dragon.HP === 0)}
                  >
                    확인
                  </button>
                </div>
              </div>
            )}

          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default BattleComponent;
