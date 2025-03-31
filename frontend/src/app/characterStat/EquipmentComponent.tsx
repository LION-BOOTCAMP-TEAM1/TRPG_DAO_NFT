'use client';

import TabComponent from "./TabComponent";

const EquipmentComponent = () => {

  return (
    <div>
      <div className='flex flex-col justify-start'>
        {/* 슬롯 아이콘 */}
        <div className="flex flex-wrap justify-between mb-4">
          <img src="/slot1.png" className="w-[22%] h-auto" />
          <img src="/slot2.png" className="w-[22%] h-auto" />
          <img src="/slot3.png" className="w-[22%] h-auto" />
          <img src="/slot4.png" className="w-[22%] h-auto" />
        </div>

        {/* 능력치 */}
        <div className="aspect-[16/4] bg-[url('/stat.png')] bg-cover bg-center px-2 py-4 flex flex-col justify-center items-center mb-4">
          <p className="font-semibold mb-2 text-white">추가 능력치</p>
          <div className="grid grid-cols-3 gap-4 p-1 rounded shadow-inner w-full">
            <div className="flex items-center gap-1 bg-gray-600 rounded p-1 justify-center">
              <img src="/attack.png" alt="공격력" className="w-5 h-5" />
              <span className="text-sm text-white font-medium">+100</span>
            </div>

            <div className="flex items-center gap-1 bg-gray-600 rounded p-1 justify-center">
              <img src="/magic.png" alt="마법력" className="w-5 h-5" />
              <span className="text-sm text-white font-medium">+100</span>
            </div>

            <div className="flex items-center gap-1 bg-gray-600 rounded p-1 justify-center">
              <img src="/defence.png" alt="방어력" className="w-5 h-5" />
              <span className="text-sm text-white font-medium">+100</span>
            </div>
            <div className="flex items-center gap-1 bg-gray-600 rounded p-1 justify-center">
              <img src="/str.png" alt="STR" className="w-5 h-5" />
              <span className="text-sm text-white font-medium">+10</span>
            </div>

            <div className="flex items-center gap-1 bg-gray-600 rounded p-1 justify-center">
              <img src="/agi.png" alt="AGI" className="w-5 h-5" />
              <span className="text-sm text-white font-medium">+30</span>
            </div>

            <div className="flex items-center gap-1 bg-gray-600 rounded p-1 justify-center">
              <img src="/int.png" alt="INT" className="w-5 h-5" />
              <span className="text-sm text-white font-medium">+20</span>
            </div>
            <div className="flex items-center gap-1 bg-gray-600 rounded p-1 justify-center">
              <img src="/chr.png" alt="CHR" className="w-5 h-5" />
              <span className="text-sm text-white font-medium">+40</span>
            </div>

            <div className="flex items-center gap-1 bg-gray-600 rounded p-1 justify-center">
              <img src="/health.png" alt="HEALTH" className="w-5 h-5" />
              <span className="text-sm text-white font-medium">+30</span>
            </div>

            <div className="flex items-center gap-1 bg-gray-600 rounded p-1 justify-center">
              <img src="/wis.png" alt="WIS" className="w-5 h-5" />
              <span className="text-sm text-white font-medium">+10</span>
            </div>            
          </div>
        </div>

        {/* 내 아이템 및 NFT */}
        <TabComponent 
          tabs={['무기', '방어구', '칭호']}
          contents={[
            <div key="1">
              <div className="w-full h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent pr-2">
                <div className="grid grid-cols-5 w-full justify-items-center gap-y-4">
                  {Array.from({ length: 10 }).map((_, index) => (
                    <div className="relative w-full flex justify-center mt-2" key={index}>
                    {/* NFT 뱃지 */}
                    <div
                      className="absolute rounded-md bg-red-600 text-white px-2 py-0.5 shadow-md"
                      style={{
                        fontSize: '8px',
                        right: '-4px',
                        top: '-4px',
                      }}
                    >
                      NFT
                    </div>
                  
                    {/* NFT 이미지 */}
                    <img 
                      src={`https://violet-eligible-junglefowl-936.mypinata.cloud/ipfs/bafybeiduz2r7r7y5dzkxw4kkgzhek2lty3rgoaey5fnvmblb6gsryiu6pe/${index+1}.png`}
                      className="w-[80%] h-auto rounded-md border border-gray-300"
                    />
                  </div>
                  ))}
                </div>
              </div>
            </div>,
            <div key="2">
              <div className="w-full h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent pr-2">
                <div className="grid grid-cols-5 w-full justify-items-center gap-y-4">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div className="relative w-full flex justify-center mt-2" key={index}>
                      {/* NFT 뱃지 */}
                      <div
                        className="absolute rounded-md bg-red-600 text-white px-2 py-0.5 shadow-md"
                        style={{
                          fontSize: '8px',
                          right: '-4px',
                          top: '-4px',
                        }}
                      >
                        NFT
                      </div>
                    
                      {/* NFT 이미지 */}
                      <img 
                        src={`https://violet-eligible-junglefowl-936.mypinata.cloud/ipfs/bafybeiduz2r7r7y5dzkxw4kkgzhek2lty3rgoaey5fnvmblb6gsryiu6pe/${index+11}.png`}
                        className="w-[80%] h-auto rounded-md border border-gray-300"
                      />
                    </div>
                  
                  ))}
                </div>
              </div>
            </div>,
            <div key="3">
            <div className="w-full h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent pr-2">
              <div className="grid grid-cols-5 w-full justify-items-center gap-y-4">
                {Array.from({ length: 5 }).map((_, index) => (
                    <div className="relative w-full flex justify-center mt-2" key={index}>
                  {/* NFT 뱃지 */}
                  <div
                    className="absolute rounded-md bg-red-600 text-white px-2 py-0.5 shadow-md"
                    style={{
                      fontSize: '8px',
                      right: '-4px',
                      top: '-4px',
                    }}
                  >
                    NFT
                  </div>
                
                  {/* NFT 이미지 */}
                  <img 
                    src={`https://violet-eligible-junglefowl-936.mypinata.cloud/ipfs/bafybeiduz2r7r7y5dzkxw4kkgzhek2lty3rgoaey5fnvmblb6gsryiu6pe/${index+15}.png`}
                    className="w-[80%] h-auto rounded-md border border-gray-300"
                  />
                </div>
                ))}
              </div>
            </div>
          </div>
          ]}
        />
      </div>
    </div>
  );
};

export default EquipmentComponent;
