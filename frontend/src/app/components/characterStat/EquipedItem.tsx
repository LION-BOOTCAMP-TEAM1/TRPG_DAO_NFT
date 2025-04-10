interface EquipedItemProps {
  image: string | undefined;
  rarity: number | undefined;
  defaultImage: string;
  removeEvent: () => void;
}
  
const EquipedItem = ({ image, rarity, defaultImage, removeEvent }: EquipedItemProps) => {
  return (
    <div className={`relative group p-1 w-[22%] h-auto ${rarity ? `rarity-${rarity}` : 'bg-gray-600'}`}>
      {/* 이미지 */}
      <img
        src={image ? image : defaultImage}
        className="rounded w-full h-full object-cover"
        alt="equipped-item"
      />

      {/* 마우스 오버 시 나타나는 제거 버튼 */}
      {image
      && <button
          onClick={removeEvent}
          className="absolute top-0 right-0 w-5 h-5 rounded-full bg-red-600 text-white text-xs font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
      >
          –
      </button>}
    </div>
  );
};
  
export default EquipedItem;
  