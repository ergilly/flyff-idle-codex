import type { Character, CharacterEquipment, CharacterEquipmentSlot, ItemMetadata } from "@/lib/api";
import { getCharacterEquipmentSet } from "@/lib/characterEquipment";
import { getCombatStats } from "@/lib/combatStats";
import type { CombatStat } from "@/lib/combat/types";
import { getEquipmentSlotForItem, getItemRequirementErrors } from "@/lib/itemEquipment";

export type ItemComparisonDirection = "increase" | "decrease" | "unchanged";

export type ItemComparisonRow = {
  after: string;
  before: string;
  direction: ItemComparisonDirection;
  label: string;
};

export type ItemComparison = {
  canEquip: boolean;
  currentItem: ItemMetadata | null;
  requirementErrors: string[];
  rows: ItemComparisonRow[];
  targetSlot: CharacterEquipmentSlot | null;
};

function getNumericParts(value: string) {
  return (value.match(/-?[\d.]+/g) ?? []).map(Number);
}

function compareValues(before: string, after: string): ItemComparisonDirection {
  const beforeParts = getNumericParts(before);
  const afterParts = getNumericParts(after);

  for (let index = 0; index < Math.max(beforeParts.length, afterParts.length); index += 1) {
    const beforeValue = beforeParts[index] ?? 0;
    const afterValue = afterParts[index] ?? 0;

    if (afterValue > beforeValue) {
      return "increase";
    }

    if (afterValue < beforeValue) {
      return "decrease";
    }
  }

  return "unchanged";
}

function buildComparisonCharacter(character: Character, equipmentSet: number, equipment: CharacterEquipment) {
  if (equipmentSet === 0 && !character.equipmentSets?.length) {
    return { ...character, equipment };
  }

  const equipmentSets = [...(character.equipmentSets ?? [])];
  equipmentSets[equipmentSet] = equipment;

  return { ...character, equipmentSets };
}

function buildComparisonRows(before: CombatStat[], after: CombatStat[]) {
  const afterByLabel = new Map(after.map((stat) => [stat.label, stat.value]));

  return before.flatMap((stat) => {
    const afterValue = afterByLabel.get(stat.label);

    if (afterValue === undefined || afterValue === stat.value) {
      return [];
    }

    return [
      {
        after: afterValue,
        before: stat.value,
        direction: compareValues(stat.value, afterValue),
        label: stat.label
      }
    ];
  });
}

export function getItemComparison(
  character: Character,
  item: ItemMetadata,
  itemsById: Record<string, ItemMetadata>,
  equipmentSet = 0
): ItemComparison {
  const equipment = getCharacterEquipmentSet(character, equipmentSet);
  const targetSlot = getEquipmentSlotForItem(character, item, equipment, itemsById);
  const requirementErrors = getItemRequirementErrors(character, item, equipment, itemsById);
  const currentItemId = targetSlot ? equipment[targetSlot] : null;
  const currentItem = currentItemId ? (itemsById[currentItemId] ?? null) : null;

  if (requirementErrors.length > 0 || !targetSlot) {
    return { canEquip: false, currentItem, requirementErrors, rows: [], targetSlot };
  }

  const nextEquipment = {
    ...equipment,
    [targetSlot]: item.id,
    ...(targetSlot === "mainhand" && item.twoHanded ? { offhand: null } : {})
  };
  const comparisonCharacter = buildComparisonCharacter(character, equipmentSet, nextEquipment);
  const comparisonItemsById = { ...itemsById, [item.id]: item };
  const before = getCombatStats(character, comparisonItemsById, equipmentSet);
  const after = getCombatStats(comparisonCharacter, comparisonItemsById, equipmentSet);

  return {
    canEquip: true,
    currentItem,
    requirementErrors,
    rows: buildComparisonRows(before, after),
    targetSlot
  };
}
