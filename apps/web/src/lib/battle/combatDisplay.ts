import { type Character, type ItemMetadata, type MonsterFamilyVariant } from "@/lib/api";
import { type CharacterResourceState } from "@/lib/battle/types";
import { getCombatStats, type CombatStat } from "@/lib/combatStats";

export function getVariantPower(variant: MonsterFamilyVariant | null) {
  if (!variant) {
    return 0;
  }

  return Math.max(1, Math.round(((variant.minAttack ?? 0) + (variant.maxAttack ?? 0)) / 2));
}

function getCombatStatNumber(combatStats: CombatStat[], label: string) {
  const stat = combatStats.find((entry) => entry.label === label);
  const value = Number(stat?.value.replace(/,/g, ""));

  return Number.isFinite(value) ? value : 0;
}

export function getMaxCharacterResources(
  character: Character,
  itemsById: Record<string, ItemMetadata>,
  equipmentSet: number
): CharacterResourceState {
  const combatStats = getCombatStats(character, itemsById, equipmentSet);

  return {
    fp: getCombatStatNumber(combatStats, "Max FP"),
    hp: getCombatStatNumber(combatStats, "Max HP"),
    mp: getCombatStatNumber(combatStats, "Max MP")
  };
}

export function withEffectiveHitRate(combatStats: CombatStat[], effectiveHitRate: number) {
  return combatStats.map((stat) =>
    stat.label === "Hit Rate"
      ? {
          label: "Hit Rate",
          value: `${effectiveHitRate.toFixed(0)}%`
        }
      : stat
  );
}
