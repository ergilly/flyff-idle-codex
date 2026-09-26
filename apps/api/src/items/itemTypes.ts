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
  abilities: Array<{ parameter: string; add: number | null; rate: boolean }>;
};
