import { Item } from "@/store/types";
import { useState } from "react";
import { toast } from "sonner";
import { setForSale } from "@/utils/web3_market";
import TooltipPortal from "@/app/components/TooltipPortal";

interface MyNFTItemProps {
  nft: Item;
  approve: Boolean;
  refresh: () => void;
}

const MyNFTItem = ({ nft, approve, refresh }: MyNFTItemProps) => {
  const [amount, setAmount] = useState('');
  const [price, setPrice] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const handleMouseEnter = (e: React.MouseEvent) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setTooltipPos({ x: rect.right + 10, y: rect.top });
    setTooltipVisible(true);
  };
  
  const handleMouseLeave = () => {
    setTooltipVisible(false);
  };

  const getTypeString = (v: number) => {
    switch (v) {
      case 1: return '무기';
      case 2: return '방어구';
      case 3: return '악세사리';
      case 4: return '칭호';
      default: return '-';
    }
  };

  const handleSale = async () => {
    if (Number.isNaN(Number(amount))) {
      toast.error('수량을 숫자로 입력해주세요');
      return;
    }
    if (Number.isNaN(Number(price))) {
      toast.error('가격을 숫자로 입력해주세요');
      return;
    }
    if (Number(amount) <= 0 || Number(price) <= 0) {
      toast.error('0 보다 큰 숫자를 입력하세요');
      return;
    }

    setIsLoading(true);
    const result = await setForSale(nft.id, Number(amount), price);
    if (result) {
      setAmount('');
      setPrice('');
      refresh();
    }
    setIsLoading(false);
  };

  return (
    <div className="bg-fantasy-surface/80 dark:bg-[var(--fantasy-surface)]/80 px-4 py-3 rounded border flex items-center justify-between gap-4">
      <div className="flex items-center gap-4 min-w-0">
        <div className={`rarity-${nft.rarity} p-1 relative`}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <img src={nft.image} alt={nft.name} className="w-12 h-12 rounded shrink-0"/>

          <TooltipPortal visible={tooltipVisible} position={tooltipPos}>
            <div className="bg-zinc-800 text-white p-3 rounded shadow-lg border border-zinc-600 w-64">
              <p className="text-fantasy-gold dark:text-[var(--fantasy-gold)] text-base font-bold mb-1">{nft.name}</p>
              <p className="text-zinc-400 mb-2">{nft.description}</p>

              <div className="border-t border-zinc-600 my-2" />

              <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-sm">
                <div className="text-zinc-400"><span>공격력</span>: {nft.stat?.attack ?? 0}</div>
                <div className="text-zinc-400"><span>마법력</span>: {nft.stat?.magic ?? 0}</div>
                <div className="text-zinc-400"><span>근력</span>: {nft.stat?.strength ?? 0}</div>
                <div className="text-zinc-400"><span>민첩성</span>: {nft.stat?.agility ?? 0}</div>
                <div className="text-zinc-400"><span>지능</span>: {nft.stat?.intelligence ?? 0}</div>
                <div className="text-zinc-400"><span>매력</span>: {nft.stat?.charisma ?? 0}</div>
                <div className="text-zinc-400"><span>체력</span>: {nft.stat?.health ?? 0}</div>
                <div className="text-zinc-400"><span>지혜</span>: {nft.stat?.wisdom ?? 0}</div>
              </div>
            </div>
          </TooltipPortal>
        </div>

        <div className="min-w-0">
          <p className="text-fantasy-gold dark:text-[var(--fantasy-gold)] font-semibold text-xs truncate">{`[${getTypeString(nft.type)}]`}</p>
          <p className="text-fantasy-gold dark:text-[var(--fantasy-gold)] font-semibold text-sm truncate">{nft.name}</p>
          <p className="text-xs text-zinc-400">수량: {nft.amount}</p>
        </div>
        <div className="text-zinc-500 mx-3">|</div>
        <p className="text-xs text-zinc-400 truncate">{nft.description}</p>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="number"
          placeholder="수량"
          value={amount}
          max={nft.amount}
          min={0}
          onChange={(e) => setAmount(e.target.value)}
          className="bg-gray-200 dark:bg-[var(--fantasy-surface)]/40
              text-gray-600 dark:text-gray-400
              border
              px-2 py-1 rounded w-20 text-sm"
        />
        <input
          type="text"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="개당 가격 (ETH)"
          className="bg-gray-200 dark:bg-[var(--fantasy-surface)]/40
              text-gray-600 dark:text-gray-400
              border
              px-2 py-1 rounded w-20 text-sm"
        />
        <div className="relative group inline-block">
          <button
            onClick={handleSale}
            disabled={!approve || isLoading}
            className={`px-3 py-1 rounded text-sm transition 
              ${approve
                ? isLoading
                  ? "bg-green-600 text-white cursor-pointer"
                  : "bg-green-600 text-white hover:bg-green-700 cursor-pointer hover:scale-110 duration-300"
                : "bg-zinc-600 text-zinc-400 cursor-not-allowed opacity-60"
              }`}
          >
            {isLoading ? (
              <svg
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
            ) : (
              <p>등록</p>
            )}
          </button>

          {!approve && (
            <div className="absolute top-full right-0 mt-2 px-2 py-1 text-xs text-white bg-zinc-700 rounded shadow opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-10">
              먼저 NFT 승인이 필요합니다
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyNFTItem;
