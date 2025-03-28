'use client';

import { useState } from "react";
import EquipmentComponent from "../equipment/EquipmentComponent";

const CharacterStat = () => {
const [open, setOpen] = useState(false);

  return (
    <div className="bg-[#f1efe1] p-2 rounded shadow flex flex-col items-center gap-2 text-sm font-medium w-full">
  {/* 상단: 캐릭터 정보 */}
  <div className="flex w-full">
    {/* 캐릭터 이미지 */}
    <img src="/character/bard.png" alt="캐릭터" className="w-24 h-24 rounded" />

    {/* 오른쪽 정보 */}
    <div className="ml-2 flex flex-col justify-between">
      {/* 클래스 */}
      <div className="bg-white px-2 py-1 rounded text-xs w-fit">음유시인</div>

      {/* 이름 */}
      <div className="bg-white px-2 py-1 rounded text-xs w-fit">게리매일</div>

      {/* 보석칸 */}
      <div className="grid grid-cols-4 gap-1 mt-2">
        <div className="w-3 h-3 rounded-full bg-red-600" />
        <div className="w-3 h-3 rounded-full bg-red-600" />
        <div className="w-3 h-3 border border-gray-400 rounded-full" />
        <div className="w-3 h-3 border border-gray-400 rounded-full" />
        <div className="w-3 h-3 rounded-full bg-teal-400" />
        <div className="w-3 h-3 rounded-full bg-teal-400" />
        <div className="w-3 h-3 border border-gray-400 rounded-full" />
        <div className="w-3 h-3 border border-gray-400 rounded-full" />
      </div>
    </div>
  </div>

  {/* 하단: 능력치 6개 */}
  <div className="grid grid-cols-3 gap-1 bg-white p-2 rounded shadow-inner w-full">
    {[
      { icon: '/attack.png', value: 999 },
      { icon: '/magic.png', value: 999 },
      { icon: '/defence.png', value: 999 },
      { icon: '/str.png', value: 7 },
      { icon: '/agi.png', value: 11 },
      { icon: '/int.png', value: 4 },
      { icon: '/chr.png', value: 6 },
      { icon: '/health.png', value: 7 },
      { icon: '/wis.png', value: 7 },
    ].map((stat, i) => (
      <div key={i} className="flex items-center gap-1 bg-gray-100 rounded p-1 justify-center">
        <img src={stat.icon} className="w-4 h-4" />
        <span>{stat.value}</span>
      </div>
    ))}
  </div>

  <div onClick={()=>setOpen(!open)}>
    <img src='/inventory.png' className="w-8 h-8" />
  </div>
  <EquipmentComponent open={open} onClose={()=> setOpen(false)}/>
</div>

  );
};

export default CharacterStat;
