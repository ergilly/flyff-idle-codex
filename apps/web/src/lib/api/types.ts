export type AuthResponse = {
  token: string;
  user: {
    id: string;
    email: string;
    displayName: string;
    isAdmin: boolean;
  };
};

export type Character = {
  id: string;
  slotIndex: number;
  name: string;
  gender: CharacterGender;
  job: string;
  progressionRank: CharacterProgressionRank;
  location?: string;
  level: number;
  exp: number;
  penya: number;
  stats: CharacterStats;
  skillLevels: CharacterSkillLevels;
  consumableLoadout?: CharacterConsumableLoadout;
  equipment: CharacterEquipment;
  equipmentSets?: CharacterEquipment[];
  inventory: CharacterInventory;
};

export type CharacterGender = "male" | "female";
export type CharacterProgressionRank = "normal" | "master" | "hero";

export type CharacterStats = {
  str: number;
  sta: number;
  dex: number;
  int: number;
};

export type CharacterSkillLevels = Record<string, number>;

export type CharacterConsumableResource = "hp" | "mp" | "fp";

export type CharacterConsumableSlot = {
  itemId: string;
  quantity: number;
} | null;

export type CharacterConsumableLoadout = Record<CharacterConsumableResource, CharacterConsumableSlot>;

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

export type CharacterEquipmentSlot = keyof CharacterEquipment;

export type CharacterInventory = {
  size: number;
  items: CharacterInventoryItem[];
};

export type CharacterInventoryItem = {
  slotIndex: number;
  itemId: string;
  quantity: number;
};

export type Bank = {
  size: number;
  penya: number;
  items: CharacterInventoryItem[];
};

export type BankUpdate = {
  bank: Bank;
  character: Character;
};

export type InventorySortOption = "name" | "level" | "job" | "category";

export type ItemMetadata = {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  category: string | null;
  subcategory: string | null;
  rarity: string | null;
  level: number | null;
  sex: string | null;
  requiredJob: string | null;
  minAttack: number | null;
  maxAttack: number | null;
  attackSpeed: string | null;
  twoHanded: boolean | null;
  minDefense: number | null;
  maxDefense: number | null;
  buyPrice?: number | null;
  stack?: number | null;
  consumable?: boolean | null;
  cooldown?: number | null;
  sellPrice?: number | null;
  tradable?: boolean | null;
  abilities: Array<{
    parameter: string;
    add: number | null;
    rate: boolean;
  }>;
};

export type MonsterMetadata = {
  id: number | string;
  name: string;
  drops?: MonsterDrop[];
  event?: boolean;
  experience?: number | null;
  icon?: string | null;
  level: number | null;
  rank: string | null;
  area: string | null;
  element: string | null;
  hp: number | null;
  minAttack: number | null;
  maxAttack: number | null;
  defense: number | null;
  magicDefense: number | null;
  sta?: number | null;
  str?: number | null;
  dex?: number | null;
  int?: number | null;
  hitRate?: number | null;
  parry?: number | null;
  noLevelReduction?: boolean | null;
  minDropGold: number | null;
  maxDropGold: number | null;
};

export type MonsterDrop = {
  item: number | string;
  probabilityRange?: string;
  prob?: string;
  common?: boolean;
};

export type MonsterQuestDrop = {
  id: number | string;
  name: string;
  icon: string | null;
};

export type MonsterVariantRank = "small" | "normal" | "captain" | "giant";
export type MonsterFamilyNames = Partial<Record<MonsterVariantRank, string>>;

export type MonsterFamilyVariant = Pick<
  MonsterMetadata,
  | "id"
  | "name"
  | "level"
  | "rank"
  | "element"
  | "experience"
  | "icon"
  | "hp"
  | "minAttack"
  | "maxAttack"
  | "defense"
  | "magicDefense"
  | "sta"
  | "str"
  | "dex"
  | "int"
  | "hitRate"
  | "parry"
  | "noLevelReduction"
  | "minDropGold"
  | "maxDropGold"
> & {
  drops?: MonsterDrop[];
  variantRank: MonsterVariantRank;
};

export type MonsterFamily = {
  name: string;
  questDrops: MonsterQuestDrop[];
  variants: MonsterFamilyVariant[];
};

export type MonsterFamilyRequest = {
  familyNames?: MonsterFamilyNames;
  monsterName: string;
};

export type MapMonsterLocation = {
  region: string;
  x: number;
  y: number;
};

export type MapMonsterMetadata = MonsterMetadata & {
  family: string;
  location: MapMonsterLocation;
};

export type MapMonsterFamily = MonsterFamily & {
  family: string;
  location: MapMonsterLocation;
};

export type DataSetQueryResponse<T> = {
  dataSet: string;
  total: number;
  limit: number;
  offset: number;
  results: T[];
};
