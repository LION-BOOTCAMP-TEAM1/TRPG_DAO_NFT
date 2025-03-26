'use client';


interface EquipmentComponentProps {
  open: boolean;
  onClose: () => void; // ⬅️ 추가
}

const EquipmentComponent = ({ open, onClose }: EquipmentComponentProps) => {
  return (
    <div
      className={`equipment-wrapper ${open ? 'slide-up' : 'slide-down'}
        h-full aspect-[2/3] p-10 absolute left-0 bottom-0 shadow-lg z-10 
        bg-[url('/equipment.png')] bg-cover bg-center
        flex justify-center items-start
      `}
    >
      <div className='flex flex-col justify-start'>
        {/* 닫기 버튼 */}
        <div className='w-full flex flex-row justify-end m-4'>
          <button
            onClick={onClose}
            className="text-white text-xl bg-black/50 rounded-full w-8 h-8 flex items-center justify-center hover:bg-black/70 transition"
          >
            ×
          </button>
        </div>

        {/* 슬롯 아이콘 */}
        <div className="flex flex-wrap justify-between mb-4">
          <img src="/slot1.png" className="w-[22%] h-auto" />
          <img src="/slot2.png" className="w-[22%] h-auto" />
          <img src="/slot3.png" className="w-[22%] h-auto" />
          <img src="/slot4.png" className="w-[22%] h-auto" />
        </div>

        {/* 스크롤 가능한 슬롯 영역 */}
        <div className="w-full h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent pr-2">
          {/* 소유 아이템 */}
          <div className="grid grid-cols-5 w-full justify-items-center gap-y-4">
            {Array.from({ length: 19 }).map((_, index) => (
              <img 
                key={index}
                src={`https://violet-eligible-junglefowl-936.mypinata.cloud/ipfs/bafybeiduz2r7r7y5dzkxw4kkgzhek2lty3rgoaey5fnvmblb6gsryiu6pe/${index+1}.png`}
                className="w-[80%] h-auto" 
              />
            ))}
          </div>
        </div>
      </div>        
    </div>
  );
};

export default EquipmentComponent;
