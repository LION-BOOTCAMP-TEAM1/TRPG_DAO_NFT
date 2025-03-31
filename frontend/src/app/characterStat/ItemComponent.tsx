import { Item } from "@/store/types";

interface ItemComponentProps {
    item: Item;
    clickEvent: (item: Item) => void;
}

const ItemComponent = ({item, clickEvent}: ItemComponentProps) => {

    return (
    <div
        className="relative w-full flex justify-center mt-2 transition-transform duration-200 ease-in-out hover:scale-120"
        onClick={() => clickEvent(item)}
    >
        {/* NFT 뱃지 */}
        {item.isNFT && <div
          className="absolute rounded-md bg-red-600 text-white px-2 py-0.5 shadow-md"
          style={{
            fontSize: '8px',
            right: '-4px',
            top: '-4px',
          }}
        >
          NFT
        </div>}
      
        {/* NFT 이미지 */}
        <img 
          src={item.image}
          className="w-[80%] h-auto rounded-md border border-gray-300"
        />
      </div>
    );
}

export default ItemComponent;