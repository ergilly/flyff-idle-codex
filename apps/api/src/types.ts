export type User = {
  id: string;
  email: string;
  displayName: string;
  passwordHash: string;
};

export type PublicUser = Omit<User, "passwordHash">;

export type Character = {
  id: string;
  playerId: string;
  slotIndex: number;
  name: string;
  job: string;
  level: number;
  exp: number;
  penya: number;
  stats: CharacterStats;
  equipment: CharacterEquipment;
  inventory: CharacterInventory;
};

export type CharacterStats = {
  str: number;
  sta: number;
  dex: number;
  int: number;
};

export type CharacterEquipment = {
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

export type CharacterInventory = {
  size: number;
  items: CharacterInventoryItem[];
};

export type CharacterInventoryItem = {
  slotIndex: number;
  itemId: string;
  quantity: number;
};

export type AuthTokenPayload = {
  sub: string;
  email: string;
};
