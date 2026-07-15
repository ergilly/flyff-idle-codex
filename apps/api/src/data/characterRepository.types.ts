import type { Character, CharacterConsumableResource, CharacterGender } from "../types.js";

export type CreateCharacterInput = {
  playerId: string;
  slotIndex: number;
  name: string;
  gender: CharacterGender;
};

export type CharacterRow = {
  id: string;
  playerId: string;
  slotIndex: number;
  name: string;
  gender: CharacterGender;
  job: string;
  progressionRank: Character["progressionRank"];
  level: number;
  exp: number;
  penya: number;
  inventorySize: number;
  str: number;
  sta: number;
  dex: number;
  int: number;
  skillLevels: string;
  consumableLoadout: string;
  equipmentSets: string;
  helmet: string | null;
  suit: string | null;
  gloves: string | null;
  boots: string | null;
  flying: string | null;
  csBoots: string | null;
  csGloves: string | null;
  csSuit: string | null;
  csHelm: string | null;
  mask: string | null;
  cloak: string | null;
  ammo: string | null;
  offhand: string | null;
  mainhand: string | null;
  ringR: string | null;
  earringR: string | null;
  necklace: string | null;
  earringL: string | null;
  ringL: string | null;
};

export type InventoryItemRow = {
  id: string;
  characterId: string;
  slotIndex: number;
  itemId: string;
  quantity: number;
};

export type InventorySortOption = "name" | "level" | "job" | "category";
export type EquipmentSlot = keyof Character["equipment"];
export type EquipmentSetIndex = 0 | 1 | 2;

export const equipmentSetIndexes = [0, 1, 2] as const;
export const consumableResources: CharacterConsumableResource[] = ["hp", "mp", "fp"];
