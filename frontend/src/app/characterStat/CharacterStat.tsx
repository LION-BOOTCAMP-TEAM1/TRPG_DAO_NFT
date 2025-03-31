'use client';

import EquipmentComponent from "./EquipmentComponent";

import {getNFTList} from "../../utils/web3";
import { AppDispatch } from "../../store";
import { useDispatch } from "react-redux";

const CharacterStat = () => {
  const dispatch = useDispatch<AppDispatch>();
  const test = () => {
    getNFTList(dispatch);
  }

  return (
    <div className="bg-[#c6beab] p-4 rounded shadow flex flex-col items-center gap-2 text-sm font-medium w-full">
      <div className="bg-red-500 rounded-2xl p-1">
        <button className="text-white" onClick={() => test()}>GetNFT Test</button>
      </div>
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

          {/* 체력 */}
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

      <EquipmentComponent />
    </div>
  );
};

export default CharacterStat;
