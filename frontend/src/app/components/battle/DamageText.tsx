// components/DamageText.tsx

"use client";

import React from "react";
import { motion } from "framer-motion";

interface DamageTextProps {
  damage: number;
  x?: number; // 화면 내 위치 조절용 (선택)
  y?: number;
}

const DamageText = ({ damage, x = 0, y = 0 }: DamageTextProps) => {

  return (
    <motion.div
      className={`absolute pointer-events-none`}
      style={{ left: x, top: y }}
      initial={{ y: 0, opacity: 1, scale: 1 }}
      animate={{ y: -30, opacity: 0, scale: 1.3 }}
      transition={{ duration: 1.5, ease: "easeOut" }}
    >
      <p className="text-4xl font-bold text-[#0400ff]" style={{ textShadow: '2px 2px 0 #fff' }}>{damage}</p>
    </motion.div>
  );
};

export default DamageText;
