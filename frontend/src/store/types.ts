export interface Item {
  id: number;
  name: string;
  description: string | null;
  image: string;
  type: number; // 무기 방어구 악세
  rarity: number;
  isNFT: boolean; // front
  amount: number;
  stat?: Partial<{
    attack: number | null;
    magic: number | null;
    strength: number | null;
    agility: number | null;
    intelligence: number | null;
    charisma: number | null;
    health: number | null;
    wisdom: number | null;
  }>;
}

export interface Character {
  id: number;
  class: string;
  name: string;
  image: string;
  stat?: Partial<{
    HP: number;
    MT: number;
    attack: number;
    magic: number;
    strength: number;
    agility: number;
    intelligence: number;
    charisma: number;
    health: number;
    wisdom: number;
  }>;
}
export interface saleContent {
    seller: string;
    price: number;
    nft_id: number;  
    amount: number;
    item: Item;
}
