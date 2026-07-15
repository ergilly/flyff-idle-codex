export type NumericInput = number | string;

export type CharacterStat = "str" | "sta" | "dex" | "int";

export type ElementName = "none" | "fire" | "water" | "electricity" | "wind" | "earth";

export type ElementValue = 0 | 1 | 2 | 3 | 4 | 5;

export type WeaponType = "sword" | "axe" | "staff" | "stick" | "knuckle" | "wand" | "bow" | "yoyo";

export type JobName =
  | "Vagrant"
  | "Assist"
  | "Billposter"
  | "Ringmaster"
  | "Acrobat"
  | "Jester"
  | "Ranger"
  | "Magician"
  | "Psykeeper"
  | "Elementor"
  | "Mercenary"
  | "Blade"
  | "Knight";

export interface LocalizedName {
  en: string;
  [language: string]: string;
}

export interface Ability {
  parameter: string;
  add: number;
  rate: boolean;
}

export interface ScalingParameter {
  parameter: string;
  scale: number;
  maximum: number;
  stat?: CharacterStat;
  pve?: boolean;
  pvp?: boolean;
}

export interface SkillLevel {
  minAttack: number;
  maxAttack: number;
  abilities: Ability[];
  scalingParameters: ScalingParameter[];
  cooldown?: number;
  damageMultiplier?: number;
  probability?: number;
}

export interface Skill {
  id: number;
  name: LocalizedName;
  class: number;
  level: number;
  levels: SkillLevel[];
  magic: boolean;
  element: ElementName;
  enabled?: boolean;
}

export interface Item {
  id: number;
  name: LocalizedName;
  category: string;
  subcategory: string;
  class: number;
  sex?: string;
  minAttack: number;
  maxAttack: number;
  minDefense: number;
  maxDefense: number;
  attackSpeedValue: number;
  additionalSkillDamage: number;
  twoHanded?: boolean;
  abilities?: Ability[];
  rarity?: string;
  element?: ElementName;
  triggerSkillProbability?: number;
  enabled?: boolean;
}

export interface ArmorSetBonus {
  ability: Ability;
}

export interface ArmorSet {
  name: LocalizedName;
  parts: number[];
  bonus?: ArmorSetBonus[];
}

export interface JobDefinition {
  id: number;
  name: LocalizedName;
  parent?: number;
}

export interface UpgradeBonus {
  upgradeLevel: number;
  suitDefense: number;
  shieldDefense: number;
  weaponAttack: number;
  setAbilities: Ability[];
}

export interface JobConstants {
  skills: Skill[];
  buffs: Skill[];
  attackSpeed: number;
  hps: number;
  HP: number;
  MP: number;
  FP: number;
  Def: number;
  MDefSta: number;
  MDefInt: number;
  block: number;
  critical: number;
  sword: number;
  axe: number;
  staff: number;
  stick: number;
  knuckle: number;
  wand: number;
  bow?: number;
  yoyo: number;
}

export interface CharacterStats {
  str: number;
  sta: number;
  dex: number;
  int: number;
  level: number;
}

export interface DamageTarget {
  level?: number;
  defense?: number;
  sta?: number;
  parry?: number;
  hp?: number;
  magicDefense?: number;
  element?: ElementName;
  resistFire?: number;
  resistWater?: number;
  resistEarth?: number;
  resistWind?: number;
  resistElectricity?: number;
  getExtraParam?: (parameter: string, rate?: boolean) => number;
  playerDamage?: number;
  ttk?: string;
  dps?: string;
  blockFactor?: string;
  effectiveHitRate?: number;
}

export interface Monster extends DamageTarget {
  level: number;
  defense: number;
  sta: number;
  parry: number;
  hp: number;
  magicDefense: number;
  name: LocalizedName;
  rank: string;
  experience: number;
  experienceTable: number[];
  spawns?: unknown[];
}

export interface DamagePerSecondSummary {
  aa: number;
  0: number;
  1: number;
  2: number;
}

export interface OptimalRatioResult {
  maxDPS: number;
  maxRatio: number;
  dpsValues: number[];
  ratios: string[];
}

export interface ImageModule {
  default: string;
}
