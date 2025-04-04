import { Item } from "@/store/types";
import { useState } from "react";
import { toast } from "sonner";

interface MyNFTItemProps {
    nft: Item;
    approve: Boolean;
}

const MyNFTItem = ({nft, approve}: MyNFTItemProps) => {
  const [amount, setAmount] = useState('');
  const [price, setPrice] = useState('');

  const getTypeString = (v: number) => {
    switch(v){
      case 1:
        return '무기'
      case 2:
        return '방어구'
      case 3:
        return '악세사리'
      case 4:
        return '칭호'
      default:
        return '-'
    }
  }

  const handleSale = () => {
    if(Number.isNaN(Number(amount))) {
        toast.error('수량을 숫자로 입력해주세요');
        return;
    }
    if(Number.isNaN(Number(price))) {
        toast.error('가격을 숫자로 입력해주세요');
        return;
    }
    if(Number(amount) <= 0 || Number(price) <= 0) {
        toast.error('0 보다 큰 숫자를 입력하세요');
        return;
    }
    
  };

  return (
    <div key={nft.id} className="bg-zinc-800 px-4 py-3 rounded border border-zinc-700 flex items-center justify-between gap-4">
      <div className="flex items-center gap-4 min-w-0">
        <div className={`rarity-${nft.rarity} p-1`}>
          <img src={nft.image} alt={nft.name} className="w-12 h-12 rounded shrink-0" />
        </div>
        <div className="flex flex-col w-[30%]">
          <p className="font-semibold text-xs truncate">{`[${getTypeString(nft.type)}]`}</p>
          <p className="font-semibold text-sm truncate">{nft.name}</p>
          <p className="text-xs text-zinc-400">수량: {nft.amount}</p>
        </div>
        <div className="text-zinc-500 mx-3">|</div>
        <p className="text-xs text-zinc-400 whitespace-pre-wrap flex-1">
          {nft.description}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="number"
          placeholder="수량"
          value={amount}
          max={nft.amount}
          min={0}
          onChange={(e) => setAmount(e.target.value)}
          className="bg-zinc-700 text-white px-2 py-1 rounded w-20 text-sm"
        />
        <input
          type="text"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="개당 가격 (ETH)"
          className="bg-zinc-700 text-white px-2 py-1 rounded w-32 text-sm"
        />
        <div className="relative group inline-block">
            <button
                onClick={() => handleSale()}
                disabled={!approve}
                className={`px-3 py-1 rounded text-sm transition 
                ${approve 
                    ? "bg-green-600 text-white hover:bg-green-700 cursor-pointer"
                    : "bg-zinc-600 text-zinc-400 cursor-not-allowed opacity-60"
                }`}
            >
                등록
            </button>

            {/* 안내 텍스트 (툴팁) */}
            {!approve && (
                <div className="absolute top-full right-0 mt-2 px-2 py-1 text-xs text-white bg-zinc-700 rounded shadow opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-10">
                    먼저 NFT 승인이 필요합니다
                </div>
            )}
        </div>
      </div>
    </div>
  );
}

export default MyNFTItem;