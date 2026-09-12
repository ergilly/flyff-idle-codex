import type { ItemMetadata } from "./generated/itemIconIndex.js";
import { findItemsByIds } from "../items/itemIconRepository.js";
import type { Character } from "../types.js";
import { getItemData, getNumberField, getStringField } from "./characterInventoryRepository.js";
import type { EquipmentSlot, InventorySortOption } from "./characterRepository.types.js";

const dualWieldJobs = new Set(["Blade", "Slayer"]);

export function compareInventoryItems(
  first: Character["inventory"]["items"][number],
  second: Character["inventory"]["items"][number],
  sortBy: InventorySortOption
) {
  const firstItem = getItemData(first.itemId);
  const secondItem = getItemData(second.itemId);
  const fallback = first.slotIndex - second.slotIndex;
  const compareText = (firstValue: string, secondValue: string) =>
    firstValue.localeCompare(secondValue, undefined, { sensitivity: "base", numeric: true });

  if (sortBy === "level") {
    return (
      (getNumberField(firstItem, "level") ?? Number.MAX_SAFE_INTEGER) -
        (getNumberField(secondItem, "level") ?? Number.MAX_SAFE_INTEGER) ||
      compareText(getStringField(firstItem, "name"), getStringField(secondItem, "name")) ||
      fallback
    );
  }
  if (sortBy === "job") {
    return (
      compareText(getStringField(firstItem, "requiredJob"), getStringField(secondItem, "requiredJob")) ||
      compareText(getStringField(firstItem, "name"), getStringField(secondItem, "name")) ||
      fallback
    );
  }
  if (sortBy === "category") {
    return (
      compareText(getStringField(firstItem, "category"), getStringField(secondItem, "category")) ||
      compareText(getStringField(firstItem, "subcategory"), getStringField(secondItem, "subcategory")) ||
      compareText(getStringField(firstItem, "name"), getStringField(secondItem, "name")) ||
      fallback
    );
  }
  return compareText(getStringField(firstItem, "name"), getStringField(secondItem, "name")) || fallback;
}

export function getEquipmentSlotForItem(
  character: Character,
  item: ItemMetadata,
  equipment = character.equipment
): EquipmentSlot | null {
  if (item.category === "weapon") {
    const [mainhandItem] = equipment.mainhand ? findItemsByIds([equipment.mainhand]) : [];
    if (dualWieldJobs.has(character.job) && isOneHandedWeapon(item) && isOneHandedWeapon(mainhandItem)) {
      return "offhand";
    }
    return "mainhand";
  }
  if (item.category === "flying") return "flying";
  if (item.category === "arrow") return "ammo";
  if (item.category === "jewelry") {
    if (item.subcategory === "necklace") return "necklace";
    if (item.subcategory === "earring") return equipment.earringL ? "earringR" : "earringL";
    if (item.subcategory === "ring") return equipment.ringL ? "ringR" : "ringL";
  }
  if (item.category === "armor") {
    if (item.subcategory === "helmet") return "helmet";
    if (item.subcategory === "suit") return "suit";
    if (item.subcategory === "gauntlet" || item.subcategory === "gloves") return "gloves";
    if (item.subcategory === "boots") return "boots";
    if (item.subcategory === "shield") return "offhand";
  }
  if (item.category === "fashion") {
    if (item.subcategory === "hat") return "csHelm";
    if (item.subcategory === "cloth") return "csSuit";
    if (item.subcategory === "glove") return "csGloves";
    if (item.subcategory === "shoes") return "csBoots";
    if (item.subcategory === "mask") return "mask";
    if (item.subcategory === "cloak" || item.subcategory === "visualcloak") return "cloak";
  }
  return null;
}

function isOneHandedWeapon(item: ItemMetadata | undefined) {
  return item?.category === "weapon" && item.twoHanded === false;
}
