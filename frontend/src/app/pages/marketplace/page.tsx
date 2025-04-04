'use client';

const marketItems = Array.from({ length: 20 }).map((_, i) => ({
  id: i,
  item: {
    name: `넘의 item ${i}`,
    description: '설명입니다~',
    image: "/slot1.png",
    type: i % 4 + 1,
    rarity: i % 5 + 1,
    isNFT: true,
    amount: i % 2 + 1,
    stat: {
      attack: 10,
      magic: 20,
      strength: 2,
      agility: 1,
      intelligence: 2,
      charisma: 1,
      health: 2,
      wisdom: 1,
    },
  },
  seller: '0x1234',
  pricePerItem: 100,
  amountAvailable: 1,
}));

const userNFTs = Array.from({ length: 20 }).map((_, i) => ({
  id: i,
  name: `내 item ${i}`,
  description: '설명입니다~',
  image: "/slot2.png",
  type: i % 4 + 1,
  rarity: i % 5 + 1,
  isNFT: true,
  amount: i % 2 + 1,
  stat: {
    attack: 10,
    magic: 20,
    strength: 2,
    agility: 1,
    intelligence: 2,
    charisma: 1,
    health: 2,
    wisdom: 1,
  },
}));

export default function NFTMarketplace() {
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
      <h1 className="text-2xl font-bold mb-4">🛒 NFT Marketplace</h1>

      <div className="grid grid-cols-2 gap-8 h-[90%]">
        {/* 왼쪽: 시장에 등록된 상품 */}
        <div className="flex flex-col h-full overflow-hidden">
          <h2 className="text-xl font-semibold mb-3">🔥 시장 상품</h2>
          <div className="space-y-3 overflow-y-auto pr-2 flex-1 scrollbar-thin scrollbar-thumb-zinc-600 scrollbar-track-transparent">
            {marketItems.map(({ id, item, seller, pricePerItem }) => (
              <div key={id} className="bg-zinc-800 px-4 py-3 rounded border border-zinc-700 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div className={`rarity-${item.rarity} p-1`}>
                    <img src={item.image} alt={item.name} className="w-12 h-12 rounded" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{`[${getTypeString(item.type)}] ${item.name}`}</p>
                    <p className="text-xs text-zinc-400">판매자: {seller}</p>
                    <p className="text-xs text-zinc-400">가격: {pricePerItem} ETH</p>
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
          <div className="space-y-3 overflow-y-auto pr-2 flex-1 scrollbar-thin scrollbar-thumb-zinc-600 scrollbar-track-transparent">
            {userNFTs.map((nft) => (
              <div key={nft.id} className="bg-zinc-800 px-4 py-3 rounded border border-zinc-700 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div className={`rarity-${nft.rarity} p-1`}>
                    <img src={nft.image} alt={nft.name} className="w-12 h-12 rounded" />
                  </div>
                  <div className="min-w-0">
                  <p className="font-semibold text-sm truncate">{`[${getTypeString(nft.type)}] ${nft.name}`}</p>
                    <p className="text-xs text-zinc-400">수량: {nft.amount}</p>
                  </div>
                  <div className="text-zinc-500 mx-3">|</div>
                  <p className="text-xs text-zinc-400 truncate">{nft.description}</p>
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