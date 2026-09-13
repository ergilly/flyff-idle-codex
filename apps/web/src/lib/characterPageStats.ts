import type { Character, ItemMetadata } from "@/lib/api";
import { getCombatStats } from "@/lib/combatStats";

export function getCharacterDetailStats(
  character: Character,
  itemsById: Record<string, ItemMetadata>,
  activeEquipmentSet: number
) {
  const statsByLabel = new Map(
    getCombatStats(character, itemsById, activeEquipmentSet).map((stat) => [stat.label, stat.value])
  );
  return [
    { label: "ATK", value: statsByLabel.get("Attack") ?? 0 },
    { label: "DEF", value: statsByLabel.get("Defense") ?? 0 },
    { label: "Crit%", value: statsByLabel.get("Critical Chance") ?? "0%" },
    { label: "Attk Speed", value: statsByLabel.get("Attack Speed") ?? "0%" }
  ];
}
