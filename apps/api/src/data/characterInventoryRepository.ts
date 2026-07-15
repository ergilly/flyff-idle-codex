import { randomUUID } from "node:crypto";
import { db } from "./database.js";
import type { Character } from "../types.js";
import { findDataRecord, type JsonDataRecord } from "../gameData/gameData.service.js";
import { findItemsByIds } from "../items/itemIconRepository.js";
import type { ItemMetadata } from "../data/generated/itemIconIndex.js";
import { persistConsumableLoadout } from "./characterEquipmentRepository.js";
import {
  consumableResources,
  type EquipmentSlot,
  type InventorySortOption
} from "./characterRepository.types.js";

const dualWieldJobs = new Set(["Blade", "Slayer"]);

export function getOpenInventorySlots(character: Character, additionalOpenSlots: number[] = []) {
  const usedSlotIndexes = new Set(character.inventory.items.map((item) => item.slotIndex));

  for (const slotIndex of additionalOpenSlots) {
    usedSlotIndexes.delete(slotIndex);
  }

  return Array.from({ length: character.inventory.size }, (_slot, index) => index).filter(
    (index) => !usedSlotIndexes.has(index)
  );
}

export function getItemData(itemId: string) {
  return findDataRecord("items", itemId);
}

export function getStringField(item: JsonDataRecord | undefined, field: string) {
  const value = item?.[field];

  return typeof value === "string" ? value : "";
}

export function getNumberField(item: JsonDataRecord | undefined, field: string) {
  const value = item?.[field];

  return typeof value === "number" ? value : null;
}

export function getMaxStackSize(itemId: string) {
  const stack = getNumberField(getItemData(itemId), "stack");

  return stack && stack > 0 ? stack : 1;
}

export function updateInventorySize(characterId: string, slotIndex: number, now: string) {
  db.prepare(
    "UPDATE characters SET inventory_size = MAX(inventory_size, ?), updated_at = ? WHERE id = ?"
  ).run(slotIndex + 1, now, characterId);
}

export function setInventorySlot(
  character: Character,
  playerId: string,
  inventoryItem: { itemId: string; quantity: number; slotIndex: number },
  now: string
) {
  if (inventoryItem.slotIndex >= character.inventory.size || character.playerId !== playerId) {
    return false;
  }

  const existingItem = db
    .prepare("SELECT id FROM character_inventory_items WHERE character_id = ? AND slot_index = ?")
    .get(character.id, inventoryItem.slotIndex) as { id: string } | undefined;

  if (existingItem) {
    db.prepare(
      "UPDATE character_inventory_items SET item_id = ?, quantity = ?, updated_at = ? WHERE id = ?"
    ).run(inventoryItem.itemId, inventoryItem.quantity, now, existingItem.id);
    return true;
  }

  db.prepare(
    "INSERT INTO character_inventory_items (id, character_id, slot_index, item_id, quantity, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
  ).run(
    randomUUID(),
    character.id,
    inventoryItem.slotIndex,
    inventoryItem.itemId,
    inventoryItem.quantity,
    now,
    now
  );

  return true;
}

export function addInventoryQuantity(
  characterId: string,
  character: Character,
  itemId: string,
  quantity: number,
  now: string,
  options: { stackIntoEquippedConsumables?: boolean } = {}
) {
  let remainingQuantity = quantity;
  const maxStackSize = getMaxStackSize(itemId);
  const shouldStackIntoEquippedConsumables = options.stackIntoEquippedConsumables ?? true;
  const matchingConsumableResources = shouldStackIntoEquippedConsumables
    ? consumableResources.filter((resource) => {
        const consumable = character.consumableLoadout[resource];

        return consumable?.itemId === itemId && consumable.quantity < maxStackSize;
      })
    : [];
  const matchingStacks = character.inventory.items
    .filter((item) => item.itemId === itemId && item.quantity < maxStackSize)
    .sort((first, second) => first.slotIndex - second.slotIndex);
  const openSlots = getOpenInventorySlots(character);
  const availableEquippedConsumableQuantity = matchingConsumableResources.reduce((total, resource) => {
    const consumable = character.consumableLoadout[resource];

    return total + (consumable ? maxStackSize - consumable.quantity : 0);
  }, 0);
  const availableStackQuantity = matchingStacks.reduce(
    (total, stack) => total + maxStackSize - stack.quantity,
    0
  );

  if (
    availableEquippedConsumableQuantity + availableStackQuantity + openSlots.length * maxStackSize <
    quantity
  ) {
    return false;
  }

  if (matchingConsumableResources.length > 0) {
    const nextConsumableLoadout = { ...character.consumableLoadout };

    for (const resource of matchingConsumableResources) {
      const consumable = nextConsumableLoadout[resource];

      if (!consumable) {
        continue;
      }

      const addedQuantity = Math.min(maxStackSize - consumable.quantity, remainingQuantity);

      nextConsumableLoadout[resource] = {
        ...consumable,
        quantity: consumable.quantity + addedQuantity
      };
      remainingQuantity -= addedQuantity;

      if (remainingQuantity === 0) {
        break;
      }
    }

    persistConsumableLoadout(characterId, nextConsumableLoadout, now);

    if (remainingQuantity === 0) {
      return true;
    }
  }

  for (const stack of matchingStacks) {
    const addedQuantity = Math.min(maxStackSize - stack.quantity, remainingQuantity);

    db.prepare(
      "UPDATE character_inventory_items SET quantity = ?, updated_at = ? WHERE character_id = ? AND slot_index = ?"
    ).run(stack.quantity + addedQuantity, now, characterId, stack.slotIndex);
    remainingQuantity -= addedQuantity;

    if (remainingQuantity === 0) {
      return true;
    }
  }

  const requiredOpenSlots = Math.ceil(remainingQuantity / maxStackSize);

  if (openSlots.length < requiredOpenSlots) {
    return false;
  }

  const insertInventoryItem = db.prepare(
    "INSERT INTO character_inventory_items (id, character_id, slot_index, item_id, quantity, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
  );

  for (const slotIndex of openSlots.slice(0, requiredOpenSlots)) {
    const stackQuantity = Math.min(maxStackSize, remainingQuantity);

    insertInventoryItem.run(randomUUID(), characterId, slotIndex, itemId, stackQuantity, now, now);
    updateInventorySize(characterId, slotIndex, now);
    remainingQuantity -= stackQuantity;
  }

  return remainingQuantity === 0;
}

export function swapInventorySlots(
  characterId: string,
  fromSlotIndex: number,
  toSlotIndex: number,
  now: string
) {
  const temporarySlotIndex = -1;

  db.prepare(
    "UPDATE character_inventory_items SET slot_index = ?, updated_at = ? WHERE character_id = ? AND slot_index = ?"
  ).run(temporarySlotIndex, now, characterId, fromSlotIndex);
  db.prepare(
    "UPDATE character_inventory_items SET slot_index = ?, updated_at = ? WHERE character_id = ? AND slot_index = ?"
  ).run(fromSlotIndex, now, characterId, toSlotIndex);
  db.prepare(
    "UPDATE character_inventory_items SET slot_index = ?, updated_at = ? WHERE character_id = ? AND slot_index = ?"
  ).run(toSlotIndex, now, characterId, temporarySlotIndex);
}

export function reassignInventorySlots(
  characterId: string,
  slotMoves: Array<{ fromSlotIndex: number; toSlotIndex: number }>,
  now: string
) {
  const offset = 1000;
  const updateSlot = db.prepare(
    "UPDATE character_inventory_items SET slot_index = ?, updated_at = ? WHERE character_id = ? AND slot_index = ?"
  );

  for (const { fromSlotIndex } of slotMoves) {
    updateSlot.run(fromSlotIndex + offset, now, characterId, fromSlotIndex);
  }

  for (const { fromSlotIndex, toSlotIndex } of slotMoves) {
    updateSlot.run(toSlotIndex, now, characterId, fromSlotIndex + offset);
  }

  if (slotMoves.length > 0) {
    updateInventorySize(characterId, Math.max(...slotMoves.map((move) => move.toSlotIndex)), now);
  }
}

export function compareText(first: string, second: string) {
  return first.localeCompare(second, undefined, { sensitivity: "base", numeric: true });
}

export function compareInventoryItems(
  first: Character["inventory"]["items"][number],
  second: Character["inventory"]["items"][number],
  sortBy: InventorySortOption
) {
  const firstItem = getItemData(first.itemId);
  const secondItem = getItemData(second.itemId);
  const fallback = first.slotIndex - second.slotIndex;

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

export function getFirstOpenPairSlot(
  equipment: Character["equipment"],
  leftSlot: "earringL" | "ringL",
  rightSlot: "earringR" | "ringR"
) {
  return equipment[leftSlot] ? rightSlot : leftSlot;
}

export function canDualWieldOneHandedWeapons(character: Character) {
  return dualWieldJobs.has(character.job);
}

export function isOneHandedWeapon(item: ItemMetadata | undefined) {
  return item?.category === "weapon" && item.twoHanded === false;
}

export function getEquipmentSlotForItem(
  character: Character,
  item: ItemMetadata,
  equipment = character.equipment
): EquipmentSlot | null {
  if (item.category === "weapon") {
    const [mainhandItem] = equipment.mainhand ? findItemsByIds([equipment.mainhand]) : [];

    if (
      canDualWieldOneHandedWeapons(character) &&
      isOneHandedWeapon(item) &&
      isOneHandedWeapon(mainhandItem)
    ) {
      return "offhand";
    }

    return "mainhand";
  }

  if (item.category === "flying") {
    return "flying";
  }

  if (item.category === "arrow") {
    return "ammo";
  }

  if (item.category === "jewelry") {
    if (item.subcategory === "necklace") {
      return "necklace";
    }

    if (item.subcategory === "earring") {
      return getFirstOpenPairSlot(equipment, "earringL", "earringR");
    }

    if (item.subcategory === "ring") {
      return getFirstOpenPairSlot(equipment, "ringL", "ringR");
    }
  }

  if (item.category === "armor") {
    if (item.subcategory === "helmet") {
      return "helmet";
    }

    if (item.subcategory === "suit") {
      return "suit";
    }

    if (item.subcategory === "gauntlet" || item.subcategory === "gloves") {
      return "gloves";
    }

    if (item.subcategory === "boots") {
      return "boots";
    }

    if (item.subcategory === "shield") {
      return "offhand";
    }
  }

  if (item.category === "fashion") {
    if (item.subcategory === "hat") {
      return "csHelm";
    }

    if (item.subcategory === "cloth") {
      return "csSuit";
    }

    if (item.subcategory === "glove") {
      return "csGloves";
    }

    if (item.subcategory === "shoes") {
      return "csBoots";
    }

    if (item.subcategory === "mask") {
      return "mask";
    }

    if (item.subcategory === "cloak" || item.subcategory === "visualcloak") {
      return "cloak";
    }
  }

  return null;
}

export function insertInventoryItems(
  characterId: string,
  itemIds: string[],
  slotIndexes: number[],
  now: string
) {
  const maximumSlotIndex = Math.max(...slotIndexes, -1);

  if (maximumSlotIndex >= 0) {
    db.prepare(
      "UPDATE characters SET inventory_size = MAX(inventory_size, ?), updated_at = ? WHERE id = ?"
    ).run(maximumSlotIndex + 1, now, characterId);
  }

  const insertInventoryItem = db.prepare(
    "INSERT INTO character_inventory_items (id, character_id, slot_index, item_id, quantity, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
  );

  itemIds.forEach((itemId, index) => {
    insertInventoryItem.run(randomUUID(), characterId, slotIndexes[index], itemId, 1, now, now);
  });
}
