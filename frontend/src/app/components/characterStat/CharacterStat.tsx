'use client';

import EquipmentComponent from "./EquipmentComponent";

import {randomMint} from "@/utils/web3";
import { RootState, AppDispatch } from "@/store";
import { useDispatch, useSelector } from "react-redux";
import { toast } from 'sonner';

const CharacterStat = () => {
  const myNFTs = useSelector((state: RootState) => state.character);
  const dispatch = useDispatch<AppDispatch>();

  const mintNFT = async () => {
    const item = await randomMint(dispatch);
    if(item) {
      const typeString = item?.type === 1 ? '무기' : item?.type === 2 ? '방어구' : item?.type === 3 ? '악세사리' : '칭호';
    
      toast(`[${typeString}] ${item?.name}`, {
        description: item?.description,
        icon: <img src={item?.image} alt="item" width={64} height={64} />,
      });
    }
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
          <div className="text-gray-600 bg-white px-2 py-1 rounded text-xs w-fit">{myNFTs.character?.class}</div>

          {/* 이름 */}
          <div className="text-gray-600 bg-white px-2 py-1 rounded text-xs w-fit">{myNFTs.character?.name}</div>

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

      <div className='w-full flex justify-center items-center'>
        <div
          className="flex flex-col justify-center items-center px-4 py-2 bg-gradient-to-r from-yellow-400 to-red-500 text-white rounded-xl shadow-lg hover:scale-105 hover:brightness-110 active:scale-95 transition-all duration-300 mb-4"
          onClick={mintNFT}
        >
          <p className='font-bold text-lg'>🎁 아이템 뽑기!</p>
          <div className='font-light text-sm blinking-box'>단돈 0.01 ETH</div>
        </div>
      </div>
    </div>
  );
};

export default CharacterStat;
