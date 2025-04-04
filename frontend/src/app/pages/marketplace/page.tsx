'use client';

import { RootState } from "@/store";
import { useSelector } from "react-redux";
import { getSaleList } from "@/utils/web3_market";
import { useEffect, useState } from "react";
import { saleContent } from "@/store/types";

export default function NFTMarketplace() {
  const myNFTs = useSelector((state: RootState) => state.character);
  const [marketItems, setMarketItems] = useState<saleContent[]>([]);

  useEffect(() => {
    const fetchSales = async () => {
      const list = await getSaleList();
      if (list) {
        setMarketItems([...list]);
      }
    };
  
    fetchSales();
  }, []);
  
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
  return (
    <div className="bg-zinc-900 text-white h-screen p-6 overflow-hidden">
      <h1 className="text-2xl font-bold mb-4 mt-20">🛒 NFT Marketplace</h1>

      <div className="grid grid-cols-2 gap-8 h-[90%]">
        {/* 왼쪽: 시장에 등록된 상품 */}
        <div className="flex flex-col h-full overflow-hidden">
          <h2 className="text-xl font-semibold mb-3">🔥 시장 상품</h2>
          <div className="space-y-3 overflow-y-auto pr-2 flex-1 scrollbar-thin scrollbar-thumb-zinc-600 scrollbar-track-transparent pb-6">
            {marketItems.length === 0 && <p className="p-4 text-center">판매중인 NFT가 없습니다</p>}
            {marketItems.map(({ item, seller, price }, index) => (
              <div key={index} className="bg-zinc-800 px-4 py-3 rounded border border-zinc-700 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div className={`rarity-${item.rarity} p-1`}>
                    <img src={item.image} alt={item.name} className="w-12 h-12 rounded" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{`[${getTypeString(item.type)}] ${item.name}`}</p>
                    <p className="text-xs text-zinc-400">판매자: {seller}</p>
                    <p className="text-xs text-zinc-400">가격: {price / Math.pow(10, 18)} ETH</p>
                  </div>
                  <div className="text-zinc-500 mx-3">|</div>
                  <p className="text-xs text-zinc-400 truncate">{item.description}</p>
                </div>
                <button className="bg-blue-600 px-3 py-1 rounded text-sm">구매</button>
              </div>
            ))}
          </div>
        </div>

        {/* 오른쪽: 내가 보유한 NFT */}
        <div className="flex flex-col h-full overflow-hidden">
          <h2 className="text-xl font-semibold mb-3">🎒 내 NFT</h2>
          <div className="space-y-3 overflow-y-auto pr-2 flex-1 scrollbar-thin scrollbar-thumb-zinc-600 scrollbar-track-transparent pb-6">
            {myNFTs.inventory.length === 0 && <p className="p-4 text-center">보유한 NFT가 없습니다</p>}
            {myNFTs.inventory.map((nft) => (
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
                    max={nft.amount}
                    min={0}
                    className="bg-zinc-700 text-white px-2 py-1 rounded w-20 text-sm"
                  />
                  <input
                    type="text"
                    placeholder="개당 가격 (ETH)"
                    className="bg-zinc-700 text-white px-2 py-1 rounded w-32 text-sm"
                  />
                  <button className="bg-green-600 px-3 py-1 rounded text-sm">시장에 등록</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}