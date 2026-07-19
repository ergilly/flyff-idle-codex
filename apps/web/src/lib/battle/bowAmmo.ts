import { type Character, type ItemMetadata } from "@/lib/api";
import { getCharacterEquipmentSet } from "@/lib/characterEquipment";

export function isBowEquipped(
  character: Character,
  itemsById: Record<string, ItemMetadata>,
  equipmentSet: number
) {
  const equipment = getCharacterEquipmentSet(character, equipmentSet);
  return itemsById[equipment.mainhand ?? ""]?.subcategory === "bow";
}

export function getEquippedArrowQuantity(character: Character, equipmentSet: number) {
  return character.ammoQuantities?.[equipmentSet] ?? (equipmentSet === 0 ? (character.ammoQuantity ?? 0) : 0);
}

export function canPerformAutoAttack(
  character: Character,
  itemsById: Record<string, ItemMetadata>,
  equipmentSet: number
) {
  if (!isBowEquipped(character, itemsById, equipmentSet)) {
    return true;
  }

  const equipment = getCharacterEquipmentSet(character, equipmentSet);
  return (
    itemsById[equipment.ammo ?? ""]?.category === "arrow" &&
    getEquippedArrowQuantity(character, equipmentSet) > 0
  );
}
