// src/store/characterSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Item, Character } from "./types";

interface CharacterState {
    character: Character | null;
    stats: {
        maxHP: number;
        maxMT: number;
        HP: number;
        MT: number;
        attack: number;
        magic: number;
        defence: number;
        strenth: number;
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
    character: null,
    stats: {
        maxHP: 0,
        maxMT: 0,
        HP: 0,
        MT: 0,
        attack: 0,
        magic: 0,
        defence: 0,
        strenth: 0,
        agility: 0,
        intelligence: 0,
        charisma: 0,
        health: 0,
        wisdom: 0,
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
    },
    addItemToInventory(state, action: PayloadAction<Item>) {
        state.inventory.push(action.payload);
      
        // 정렬: rarity → id → isNFT (false < true)
        state.inventory.sort((a, b) => {
          // rarity가 클수록 우선
          if (a.rarity !== b.rarity) return b.rarity - a.rarity;
      
          // rarity 같으면 id가 작을수록 우선
          if (a.id !== b.id) return a.id - b.id;
      
          // rarity, id 같으면 NFT가 먼저 오도록 (true < false → false가 우선)
          return (a.isNFT === b.isNFT) ? 0 : (a.isNFT ? 1 : -1);
        });
      }      
  },
});

export const {
  equipItem,
  addItemToInventory,
} = characterSlice.actions;

export default characterSlice.reducer;
