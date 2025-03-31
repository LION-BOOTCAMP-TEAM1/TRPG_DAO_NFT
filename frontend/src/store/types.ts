export interface Item {
    id: number;
    name: string;
    description: string | null;
    image: string;
    type: string; // 무기 방어구 악세
    rarity: string;
    isNFT: boolean; // front
    stat?: Partial<{
        attack: number | null;
        magic: number | null;
        defence: number | null;
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
        attack: number;
        magic: number;
        defence: number;
        strength: number;
        agility: number;
        intelligence: number;
        charisma: number;
        health: number;
        wisdom: number;
    }>;
}
  