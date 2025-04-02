"use client";

import { motion, AnimatePresence } from "framer-motion";
import React, { useEffect, useState } from "react";
import DamageText from "./DamageText";

const frameImages = [
  "/battle/dragon1.png",
  "/battle/dragon2.png",
  "/battle/dragon3.png",
  "/battle/dragon4.png",
];

interface BattleComponentProps {
  speed: number;
  onClose: () => void;
}

const BattleComponent = ({ speed = 500, onClose }: BattleComponentProps) => { 
  const [frameIndex, setFrameIndex] = useState(0);
  const [isAttacking, setIsAttacking] = useState(false);
  const [isMonsterAttacking, setIsMonsterAttacking] = useState(false);

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
  }

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
          {/* 닫기 버튼 */}
          <button
            className="absolute top-3 right-4 text-gray-600 hover:text-red-600 text-2xl"
            onClick={onClose}
          >
            ✕
          </button>

          {/* 상단 상태바 (이름, 체력, 우세 등) */}
          <div className="flex justify-between items-center p-2 font-bold text-sm text-gray-800">
            <div className="w-[400px]">
              <div className="text-lg">게리메일</div>
              <div>🗡 27</div>
              <div className="bg-green-600 w-[120px] h-3 mt-1 relative">
                <div className="absolute left-0 text-white text-xs pl-1">240/240</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg">드래곤</div>
              <div>🗡 321</div>
              <div className="bg-red-600 w-[120px] h-3 mt-1 relative">
                <div className="absolute right-0 text-white text-xs pr-1">999/999</div>
              </div>
            </div>
          </div>

          {/* 전투 배경 및 캐릭터 영역 */}
          <div className="relative w-[400px] h-[400px] bg-[url('/battle/map.png')] bg-cover bg-center border my-2">
            {/* 공격 이펙트 */}
            {isAttacking && <div>
              <img
                src={"/battle/attack.png"}
                alt="attack_effect"
                className="absolute top-30 left-30 w-[120px] h-[120px]"
              />
              <DamageText damage={1087740} x={110} y={100} />
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
            {isMonsterAttacking && <DamageText damage={993721} x={150} y={310} />}
          </div>

          {/* 하단 UI - 스킬 및 전투 시작 버튼 등 */}
          <div className="flex justify-between w-[400px] mt-4 px-4">
            <button
              className="bg-[#aaa] hover:bg-[#888] px-4 py-2 rounded border border-gray-700 text-white font-bold"
              onClick={() => myAttack()}
            >
              때리기
            </button>
            <button
              className="bg-[#aaa] hover:bg-[#888] px-4 py-2 rounded border border-gray-700 text-white font-bold"
              onClick={() => monsterAttack()}
            >
              맞기
            </button>
            <button className="bg-[#fa7c7c] hover:bg-[#8b4f4f] px-4 py-2 rounded border border-gray-700 text-white font-bold">
              포기하기
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default BattleComponent;
