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
    setStats(state, action: PayloadAction<Partial<CharacterState["stats"]>>) {
      state.stats = { ...state.stats, ...action.payload };
    },
    equipItem(state, action: PayloadAction<Item>) {
      
    },
    addItemToInventory(state, action: PayloadAction<Item>) {
      state.inventory.push(action.payload);
    },
    removeItemFromInventory(state, action: PayloadAction<number>) {
      state.inventory = state.inventory.filter(item => item.id !== action.payload);
    },
  },
});

export const {
  setStats,
  equipItem,
  addItemToInventory,
  removeItemFromInventory,
} = characterSlice.actions;

export default characterSlice.reducer;
