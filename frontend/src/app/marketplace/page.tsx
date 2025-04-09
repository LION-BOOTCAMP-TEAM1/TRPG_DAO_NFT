'use client';

import { RootState } from "@/store";
import { useSelector } from "react-redux";
import { getSaleList } from "@/utils/web3_market";
import { useEffect, useState } from "react";
import { saleContent } from "@/store/types";
import MyNFTItem from "./myNFTItem"
import ApproveButton from "./ApproveButton";
import MarketItem from "./MarketItem";

export default function NFTMarketplace() {
  const myNFTs = useSelector((state: RootState) => state.character);
  const [marketItems, setMarketItems] = useState<saleContent[]>([]);
  const [approvedReady, setApprovedReady] = useState(false);
  const [refreshApproval, setRefreshApproval] = useState(0);
  const [sortPriceAsc, setSortPriceAsc] = useState(false);
  const [sortRarityAsc, setSortRarityAsc] = useState(false);

  const fetchSales = async () => {
    const list = await getSaleList();
    if (list) {
      setMarketItems([...list]);
    }
  };

  const refresh = () => {
    fetchSales();
    setRefreshApproval((v) => v + 1);
  };

  useEffect(() => {
    setMarketItems((prev) => [...prev].sort((a, b) => {
      if (a.item.rarity !== b.item.rarity) {
        return sortRarityAsc
          ? a.item.rarity - b.item.rarity
          : b.item.rarity - a.item.rarity;
      }
      if (a.price !== b.price) {
        return sortPriceAsc
          ? a.price - b.price
          : b.price - a.price;
      }
      return a.item.id - b.item.id;
    }));
  }, [sortPriceAsc, sortRarityAsc]);

  useEffect(() => {
    const sorted = sortPriceAsc ? [...marketItems].sort((a, b) => a.price - b.price) : [...marketItems].sort((a, b) => b.price - a.price);
    setMarketItems(sorted);
  }, [sortPriceAsc]);

  useEffect(() => {
    fetchSales();
  }, []);
  
  return (
    <div className="text-white h-screen p-6 overflow-visible">
      <p className="text-fantasy-gold dark:text-[var(--fantasy-gold)] text-2xl font-bold mb-4 mt-20">🛒 NFT Marketplace</p>

      <div className="grid grid-cols-2 gap-8 h-[90%]">
        {/* 왼쪽: 시장에 등록된 상품 */}
        <div className="flex flex-col h-full overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-fantasy-gold dark:text-[var(--fantasy-gold)] text-xl font-semibold">🔥 시장 상품</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setSortPriceAsc((v) => !v )}
                className="bg-zinc-700 px-3 py-1 rounded text-sm hover:bg-zinc-600"
              >
                가격순{sortPriceAsc ? '⬆️' : '⬇️'}
                </button>
              <button onClick={() => setSortRarityAsc((v) => !v )} className="bg-zinc-700 px-3 py-1 rounded text-sm hover:bg-zinc-600">등급순{sortRarityAsc ? '⬆️' : '⬇️'}</button>
            </div>
          </div>
          <p className="text-right text-xs text-gray-200 dark:text-gray-500 mb-2">판매 수수료는 1%입니다. 해당 수익은 서비스 운영 및 지속적인 품질 향상을 위해 사용됩니다.</p>
          <div className="space-y-3 overflow-y-auto pr-2 flex-1 scrollbar-thin scrollbar-thumb-zinc-600 scrollbar-track-transparent pb-6">
            {marketItems.length === 0 && <p className="text-fantasy-gold dark:text-[var(--fantasy-gold)] p-4 text-center">판매중인 NFT가 없습니다</p>}
            {marketItems.map(({ item, seller, price }, index) => (
              <MarketItem key={index} item={item} seller={seller} price={price} refresh={refresh} />
            ))}
          </div>
        </div>

        {/* 오른쪽: 내가 보유한 NFT */}
        <div className="flex flex-col h-full overflow-y-auto">
          <div className="flex flex-row items-center gap-10 mb-3">
            <h2 className="text-fantasy-gold dark:text-[var(--fantasy-gold)] text-xl font-semibold">🎒 내 NFT</h2>
            <ApproveButton onApproved={() => setApprovedReady(true)} refresh={refreshApproval} />
          </div>
          <div className="space-y-3 overflow-y-auto pr-2 flex-1 scrollbar-thin scrollbar-thumb-zinc-600 scrollbar-track-transparent pb-6">
            {myNFTs.inventory.length === 0 && <p className="text-fantasy-gold dark:text-[var(--fantasy-gold)] p-4 text-center">보유한 NFT가 없습니다</p>}
            {myNFTs.inventory.map((nft, index) => (
              <MyNFTItem key={index} nft={nft} approve={approvedReady} refresh={refresh} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}