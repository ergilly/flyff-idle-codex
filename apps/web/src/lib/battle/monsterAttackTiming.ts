import { type MonsterFamilyVariant } from "@/lib/api";

const legacyMonsterAttackDelaySeconds = 2.4;
const legacyMonsterAttackSpeedSeconds = 1;

export type MonsterAttackTiming = {
  attackDelaySeconds: number;
  attackSpeedSeconds: number;
};

export function getMonsterAttackTiming(monster: MonsterFamilyVariant | null): MonsterAttackTiming {
  return {
    attackDelaySeconds: monster?.attackDelay ?? legacyMonsterAttackDelaySeconds,
    attackSpeedSeconds: monster?.attackSpeed ?? legacyMonsterAttackSpeedSeconds
  };
}

export function getMonsterAttackDelaySeconds(monster: MonsterFamilyVariant | null): number {
  return getMonsterAttackTiming(monster).attackDelaySeconds;
}
