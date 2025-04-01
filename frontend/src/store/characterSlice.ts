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
        image: '/magician',
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

        // 능력치 적용
        state.stats.attack =
            (state.character?.stat?.attack ?? 0) +
            (state.equipment.weapon?.stat?.attack ?? 0) +
            (state.equipment.armor?.stat?.attack ?? 0) +
            (state.equipment.accessory?.stat?.attack ?? 0) +
            (state.equipment.title?.stat?.attack ?? 0);
        state.stats.magic =
            (state.character?.stat?.magic ?? 0) +
            (state.equipment.weapon?.stat?.magic ?? 0) +
            (state.equipment.armor?.stat?.magic ?? 0) +
            (state.equipment.accessory?.stat?.magic ?? 0) +
            (state.equipment.title?.stat?.magic ?? 0);
        state.stats.strength =
            (state.character?.stat?.strength ?? 0) +
            (state.equipment.weapon?.stat?.strength ?? 0) +
            (state.equipment.armor?.stat?.strength ?? 0) +
            (state.equipment.accessory?.stat?.strength ?? 0) +
            (state.equipment.title?.stat?.strength ?? 0);
        state.stats.agility =
            (state.character?.stat?.agility ?? 0) +
            (state.equipment.weapon?.stat?.agility ?? 0) +
            (state.equipment.armor?.stat?.agility ?? 0) +
            (state.equipment.accessory?.stat?.agility ?? 0) +
            (state.equipment.title?.stat?.agility ?? 0);
        state.stats.intelligence =
            (state.character?.stat?.intelligence ?? 0) +
            (state.equipment.weapon?.stat?.intelligence ?? 0) +
            (state.equipment.armor?.stat?.intelligence ?? 0) +
            (state.equipment.accessory?.stat?.intelligence ?? 0) +
            (state.equipment.title?.stat?.intelligence ?? 0);
        state.stats.charisma =
            (state.character?.stat?.charisma ?? 0) +
            (state.equipment.weapon?.stat?.charisma ?? 0) +
            (state.equipment.armor?.stat?.charisma ?? 0) +
            (state.equipment.accessory?.stat?.charisma ?? 0) +
            (state.equipment.title?.stat?.charisma ?? 0);
        state.stats.health =
            (state.character?.stat?.health ?? 0) +
            (state.equipment.weapon?.stat?.health ?? 0) +
            (state.equipment.armor?.stat?.health ?? 0) +
            (state.equipment.accessory?.stat?.health ?? 0) +
            (state.equipment.title?.stat?.health ?? 0);
        state.stats.wisdom =
            (state.character?.stat?.wisdom ?? 0) +
            (state.equipment.weapon?.stat?.wisdom ?? 0) +
            (state.equipment.armor?.stat?.wisdom ?? 0) +
            (state.equipment.accessory?.stat?.wisdom ?? 0) +
            (state.equipment.title?.stat?.wisdom ?? 0);

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
