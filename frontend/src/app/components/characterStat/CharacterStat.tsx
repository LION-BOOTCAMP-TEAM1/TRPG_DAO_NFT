'use client';

import EquipmentComponent from "./EquipmentComponent";

import {getNFTList, randomMint} from "@/utils/web3";
import { RootState, AppDispatch } from "@/store";
import { useDispatch, useSelector } from "react-redux";
import BattleComponent from "../battle/BattleComponent";
import { useState } from "react";
import { toast } from 'sonner';

const CharacterStat = () => {
  const myNFTs = useSelector((state: RootState) => state.character);

  // 테스트 코드
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState("");
  const dispatch = useDispatch<AppDispatch>();
  const test = () => {
    getNFTList(dispatch);
  }
  //

  const mintNFT = async () => {
    const item = await randomMint(dispatch);
    const typeString = item?.type === 1 ? '무기' : item?.type === 2 ? '방어구' : item?.type === 3 ? '악세사리' : '칭호';
    
    toast(`[${typeString}] ${item?.name}`, {
      description: item?.description,
      icon: <img src={item?.image} alt="item" width={64} height={64} />,
    });
  }

  return (
    <div className="bg-[#c6beab] p-4 rounded shadow flex flex-col items-center gap-2 text-sm font-medium w-full">
      {/* 상단: 캐릭터 정보 */}
      <div className="flex w-full">
        {/* 캐릭터 이미지 */}
        <img src={myNFTs.character?.image} alt="캐릭터" className="w-24 h-24 rounded" />

        {/* 오른쪽 정보 */}
        <div className="ml-2 flex flex-col justify-between">
          {/* 클래스 */}
          <div className="bg-white px-2 py-1 rounded text-xs w-fit">{myNFTs.character?.class}</div>

          {/* 이름 */}
          <div className="bg-white px-2 py-1 rounded text-xs w-fit">{myNFTs.character?.name}</div>

          <div className="grid grid-cols-4 gap-1 mt-2">
            {/* 체력 */}
            {Array.from({ length: myNFTs.stats.HP }).map((_, idx) => (
              <div key={`base-${idx}`} className="w-3 h-3 rounded-full bg-red-600" />
            ))}
            {Array.from({ length: (myNFTs.character?.stat?.HP ?? 0) - myNFTs.stats.HP > 0 ? (myNFTs.character?.stat?.HP ?? 0) - myNFTs.stats.HP : 0 }).map((_, idx) => (
              <div key={`extra-${idx}`} className="w-3 h-3 rounded-full border border-gray-400" />
            ))}

            {/* 정신력 */}
            {Array.from({ length: myNFTs.stats.MT }).map((_, idx) => (
              <div key={`extra-${idx}`} className="w-3 h-3 rounded-full bg-teal-400" />
            ))}
            {Array.from({ length: (myNFTs.character?.stat?.MT ?? 0) - myNFTs.stats.MT > 0 ? (myNFTs.character?.stat?.MT ?? 0) - myNFTs.stats.MT : 0 }).map((_, idx) => (
              <div key={`extra-${idx}`} className="w-3 h-3 rounded-full border border-gray-400" />
            ))}
          </div>
        </div>
      </div>

      <EquipmentComponent />

      <div className="bg-red-500 rounded-2xl p-1">
        <button className="text-white" onClick={() => test()}>GetNFT Test</button>
      </div>

      <div className="bg-red-500 rounded-2xl p-1">
        <button className="text-white" onClick={() => setOpen(true)}>Battle Test</button>
      </div>
      {result}
      {open && <BattleComponent speed={500} onClose={(v) => {
        setOpen(false);
        if(v) setResult("이김");
        else setResult("짐");
      }} />}
      <div className='w-full flex justify-center items-center'>
        <div
          className="flex flex-col justify-center items-center px-4 py-2 bg-gradient-to-r from-yellow-400 to-red-500 text-white rounded-xl shadow-lg hover:scale-105 hover:brightness-110 active:scale-95 transition-all duration-300 mb-4"
          onClick={mintNFT}
        >
          <p className='font-bold text-lg'>🎁 아이템 뽑기!</p>
          <div className='font-light text-sm blinking-box'>단돈 0.01 🇪🇹🇭</div>
        </div>
      </div>
    </div>
  );
};

export default CharacterStat;
