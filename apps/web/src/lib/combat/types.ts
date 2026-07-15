import { type Character, type ItemMetadata } from "@/lib/api";
import { type ItemSetBonus } from "@/lib/itemSets";

export type JobCombatConstants = {
  attackSpeed: number;
  block: number;
  critical: number;
  def: number;
  fp: number;
  fpLevel: number;
  hps: number;
  hp: number;
  hpLevel: number;
  mDefInt: number;
  mDefSta: number;
  mp: number;
  mpLevel: number;
  weaponFactors: Record<string, number>;
};

export type CombatStat = {
  label: string;
  value: string;
};

export type AttackTiming = {
  attacksPerSecond: number;
  secondsPerAttack: number;
};

export type AutoAttackDamage = {
  averageDamage: number;
  damagePerSecond: number;
  effectiveHitRate: number;
  secondsToKill: number | null;
};

export type AutoAttackResult = {
  criticalChance: number;
  damage: number;
  effectiveHitRate: number;
  isCritical: boolean;
  isHit: boolean;
};

export type CombatState = {
  attackPower: number;
  attackSpeed: number;
  attackSpeedPercent: number;
  criticalChance: number;
  criticalDamage: number;
  equippedItems: ItemMetadata[];
  level: number;
  mainhand: ItemMetadata | undefined;
  offhand: ItemMetadata | undefined;
  setBonuses: ReadonlyArray<ItemSetBonus>;
  stats: Character["stats"];
};
