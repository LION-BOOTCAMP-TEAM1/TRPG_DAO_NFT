export interface Item {
    id: number;
    name: string;
    image: string;
    type: number;
    tier: number;
    isNFT: boolean;
    stat?: Partial<{
        attack: number | null;
        magic: number | null;
        defence: number | null;
        strenth: number | null;
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
        strenth: number;
        agility: number;
        intelligence: number;
        charisma: number;
        health: number;
        wisdom: number;
    }>;
}
  