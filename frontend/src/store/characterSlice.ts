// src/store/characterSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Item, Character } from "./types";

interface CharacterState {
    character: Character | null;
    stats: {
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
    };
    equipment: {
        weapon: Item | null;
        armor: Item | null;
        accessory: Item | null;
        title: Item | null;
    };
    inventory: Item[];
}

const initialState: CharacterState = {
    character: {
        id: 1,
        class: '매지션',
        name: '게리메일',
        image: '/character/magician.png',
        stat: {
            HP: 4,
            MT: 4,
            attack: 10,
            magic: 40,
            strength: 4,
            agility: 4,
            intelligence: 10,
            charisma: 6,
            health: 4,
            wisdom: 8,
        },
    },
    stats: {
        HP: 4,
        MT: 4,
        attack: 10,
        magic: 40,
        strength: 4,
        agility: 4,
        intelligence: 10,
        charisma: 6,
        health: 4,
        wisdom: 8,
    },
    equipment: {
        weapon: null,
        armor: null,
        accessory: null,
        title: null,
    },
    inventory: [],
};

const characterSlice = createSlice({
  name: "character",
  initialState,
  reducers: {
    updateStat(state) {
        const statKeys = [
            "attack", "magic", "strength", "agility",
            "intelligence", "charisma", "health", "wisdom"
        ] as const;
         

        statKeys.forEach((key) => {
            state.stats[key] =
            (state.character?.stat?.[key] ?? 0) +
            (state.equipment.weapon?.stat?.[key] ?? 0) +
            (state.equipment.armor?.stat?.[key] ?? 0) +
            (state.equipment.accessory?.stat?.[key] ?? 0) +
            (state.equipment.title?.stat?.[key] ?? 0);
        });
    },
    equipItem(state, action: PayloadAction<Item>) {
        const slot = action.payload.type;
        switch(slot) {
            case 1:
                state.equipment.weapon = action.payload;
                break;
            case 2:
                state.equipment.armor = action.payload;
                break;
            case 3:
                state.equipment.accessory = action.payload;
                break;
            case 4:
                state.equipment.title = action.payload;
                break;
        }
        characterSlice.caseReducers.updateStat(state);
    },
    disarmItem(state, action: PayloadAction<number>) {
        switch(action.payload) {
            case 1:
                state.equipment.weapon = null;
                break;
            case 2:
                state.equipment.armor = null;
                break;
            case 3:
                state.equipment.accessory = null;
                break;
            case 4:
                state.equipment.title = null;
                break;
        }
        characterSlice.caseReducers.updateStat(state);
    },
    addItemToInventory(state, action: PayloadAction<Item>) {
        const existingItem = state.inventory.find(item => item.id === action.payload.id);

        if (existingItem) {
            // 이미 있는 아이템이면 수량만 증가
            existingItem.amount += action.payload.amount;
        } else {
            // 없으면 추가
            state.inventory.push(action.payload);
        }
      
        // 정렬: rarity → id → isNFT (false < true)
        state.inventory.sort((a, b) => {
          // rarity가 클수록 우선
          if (a.rarity !== b.rarity) return b.rarity - a.rarity;
      
          // rarity 같으면 id가 작을수록 우선
          if (a.id !== b.id) return a.id - b.id;
      
          // rarity, id 같으면 NFT가 먼저 오도록 (true < false → false가 우선)
          return (a.isNFT === b.isNFT) ? 0 : (a.isNFT ? 1 : -1);
        });
    },
    clearInventory(state) {
        state.inventory = [];
    }
  },
});

export const {
  equipItem,
  disarmItem,
  addItemToInventory,
  clearInventory,
} = characterSlice.actions;

export default characterSlice.reducer;
