import { Item } from "@/store/types";
import { useState } from "react";
import { toast } from "sonner";
import { buyNFT } from "@/utils/web3_market";

interface MarketItemProps {
    item: Item;
    seller: String;
    price: Number;
    refresh: () => void;
}

const MarketItem = ({item, seller, price, refresh}: MarketItemProps) => {
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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

  const handleBuy = async () => {
    if(Number.isNaN(Number(amount))) {
        toast.error('수량을 숫자로 입력해주세요');
        return;
    }
    if(Number(amount) <= 0) {
        toast.error('0 보다 큰 숫자를 입력하세요');
        return;
    }

    setIsLoading(true);
    const result = await buyNFT(item.id, seller, Number(amount), Number(price));
    console.log(result)
    if(result) {
        setAmount('');
        refresh();
    }
    else {
        toast.error('돈이 없으세요~ 😛');
    }
    setIsLoading(false);
  }

  return (
    <div className="bg-zinc-800 px-4 py-3 rounded border border-zinc-700 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
            <div className={`rarity-${item.rarity} p-1`}>
            <img src={item.image} alt={item.name} className="w-12 h-12 rounded" />
            </div>
            <div className="min-w-0">
            <p className="font-semibold text-sm truncate">{`[${getTypeString(item.type)}] ${item.name}`}</p>
            <p className="text-xs text-zinc-400">판매자:<span style={{ fontSize: '10px' }}>{seller}</span></p>
            <p className="text-xs text-zinc-400">가격: {price / Math.pow(10, 18)} ETH</p>
            </div>
            <div className="text-zinc-500 mx-3">|</div>
            <p className="text-xs text-zinc-400 truncate max-w-xs">{item.description}</p>
        </div>
        <div className="flex items-center gap-2">
            <input
            type="number"
            placeholder="수량"
            value={amount}
            max={item.amount}
            min={0}
            onChange={(e) => setAmount(e.target.value)}
            className="bg-zinc-700 text-white px-2 py-1 rounded w-20 text-sm"
            />
            <button
                onClick={() => handleBuy()}
                disabled={isLoading}
                className={`px-3 py-1 rounded text-sm transition 
                ${isLoading 
                ? "bg-blue-600 text-white cursor-pointer"
                : "bg-blue-600 text-white hover:bg-blue-700 cursor-pointer hover:scale-110 duration-300"}`}
            >
                {isLoading
                ? <svg
                    className="animate-spin h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                >
                    <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    ></circle>
                    <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                    ></path>
                </svg>
                :<p>구매</p>}
            </button>
        </div>
    </div>
  );
}

export default MarketItem;