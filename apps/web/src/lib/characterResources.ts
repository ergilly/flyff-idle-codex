import type { Character, ItemMetadata } from "@/lib/api";
import { getCombatStats } from "@/lib/combatStats";

export function getCharacterMaxHp(
  character: Character | null,
  itemsById: Record<string, ItemMetadata>,
  activeEquipmentSet: number
) {
  if (!character) return 0;
  const value = getCombatStats(character, itemsById, activeEquipmentSet).find(
    (stat) => stat.label === "Max HP"
  )?.value;
  const parsed = Number.parseFloat(String(value ?? "0").replace(/[^\d.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}
