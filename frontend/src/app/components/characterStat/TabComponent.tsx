'use client';

import { useState } from 'react';

interface TabComponentProps {
  tabs: string[];
  contents: React.ReactNode[];
  defaultIndex?: number;
}

const TabComponent = ({ tabs, contents, defaultIndex = 0 }: TabComponentProps) => {
  const [activeIndex, setActiveIndex] = useState(defaultIndex);

  return (
    <div className="w-full">
      {/* 탭 버튼 */}
      <div className="flex space-x-2">
        {tabs.map((tab, index) => (
          <button
            key={index}
            onClick={() => setActiveIndex(index)}
            className={`px-4 py-2 rounded-t-md border-b-2 transition-all
              ${activeIndex === index
                ? 'border-gray-500 text-gray-300 font-semibold bg-[#413029]'
                : 'border-transparent text-gray-500 hover:text-gray-200'}
            `}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* 콘텐츠 영역 */}
      <div className="bg-[#413029] rounded-b-md shadow-inner">
        {contents[activeIndex]}
        <div className='w-full flex justify-center items-center'>
          <div
            className="flex flex-col justify-center items-center px-4 py-2 bg-gradient-to-r from-yellow-400 to-red-500 text-white rounded-xl shadow-lg hover:scale-105 hover:brightness-110 active:scale-95 transition-all duration-300 mb-4"
          >
            <p className='font-bold text-lg'>🎁 아이템 뽑기!</p>
            <div className='font-light text-sm blinking-box'>단돈 0.01 🇪🇹🇭</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TabComponent;
