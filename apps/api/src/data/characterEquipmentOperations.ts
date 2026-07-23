import { findItemsByIds } from "../items/itemIconRepository.js";
import {
  getAmmoQuantityForSet,
  getEquipmentForSet,
  getEquipmentRequirementError,
  persistEquipmentSet
} from "./characterEquipmentRepository.js";
import { characterCoreRepository } from "./characterCoreRepository.js";
import { getOpenInventorySlots, insertInventoryItems } from "./characterInventoryRepository.js";
import { getEquipmentSlotForItem } from "./characterInventoryRules.js";
import type { EquipmentSetIndex, EquipmentSlot } from "./characterRepository.types.js";
import { db } from "./database.js";

export const characterEquipmentOperations = {
  equipInventoryItemForPlayer(
    id: string,
    playerId: string,
    slotIndex: number,
    equipmentSet: EquipmentSetIndex = 0
  ) {
    const character = characterCoreRepository.findById(id);
    if (!character || character.playerId !== playerId)
      return { character: null, error: "Character not found" };

    const inventoryItem = character.inventory.items.find((item) => item.slotIndex === slotIndex);
    if (!inventoryItem) return { character: null, error: "Inventory item not found" };

    const [item] = findItemsByIds([inventoryItem.itemId]);
    if (!item) return { character: null, error: "Item not found" };

    const requirementError = getEquipmentRequirementError(character, item);
    if (requirementError) return { character: null, error: requirementError };

    const targetEquipment = getEquipmentForSet(character, equipmentSet);
    const equipmentSlot = getEquipmentSlotForItem(character, item, targetEquipment);
    if (!equipmentSlot) return { character: null, error: "That item cannot be equipped" };

    if (equipmentSlot === "offhand" && targetEquipment.mainhand) {
      const [mainhandItem] = findItemsByIds([targetEquipment.mainhand]);
      if (mainhandItem?.twoHanded) return { character: null, error: "Unequip your two-handed weapon first" };
    }

    const now = new Date().toISOString();
    const returnedItemIds = [
      targetEquipment[equipmentSlot],
      equipmentSlot === "mainhand" && item.twoHanded ? targetEquipment.offhand : null
    ].filter((itemId): itemId is string => Boolean(itemId));
    const returnedItemQuantities = returnedItemIds.map((returnedItemId) =>
      equipmentSlot === "ammo" && returnedItemId === targetEquipment.ammo
        ? getAmmoQuantityForSet(character, equipmentSet)
        : 1
    );
    const inventorySlotsToUse = getOpenInventorySlots(character, [slotIndex]);
    if (inventorySlotsToUse.length < returnedItemIds.length) {
      return { character: null, error: "Not enough open inventory slots" };
    }

    db.prepare("DELETE FROM character_inventory_items WHERE character_id = ? AND slot_index = ?").run(
      id,
      slotIndex
    );
    const nextEquipment = {
      ...targetEquipment,
      [equipmentSlot]: inventoryItem.itemId,
      ...(equipmentSlot === "mainhand" && item.twoHanded ? { offhand: null } : {})
    };
    persistEquipmentSet(
      id,
      character,
      equipmentSet,
      nextEquipment,
      now,
      equipmentSlot === "ammo" ? inventoryItem.quantity : getAmmoQuantityForSet(character, equipmentSet)
    );
    insertInventoryItems(id, returnedItemIds, inventorySlotsToUse, now, returnedItemQuantities);
    return { character: characterCoreRepository.findById(id), error: null };
  },
  unequipItemForPlayer(
    id: string,
    playerId: string,
    equipmentSlot: EquipmentSlot,
    equipmentSet: EquipmentSetIndex = 0
  ) {
    const character = characterCoreRepository.findById(id);
    if (!character || character.playerId !== playerId)
      return { character: null, error: "Character not found" };

    const targetEquipment = getEquipmentForSet(character, equipmentSet);
    const itemId = targetEquipment[equipmentSlot];
    if (!itemId) return { character: null, error: "Equipment slot is empty" };

    const [slotIndex] = getOpenInventorySlots(character);
    if (slotIndex === undefined) return { character: null, error: "Inventory is full" };

    const quantity = equipmentSlot === "ammo" ? getAmmoQuantityForSet(character, equipmentSet) : 1;
    const now = new Date().toISOString();
    persistEquipmentSet(
      id,
      character,
      equipmentSet,
      { ...targetEquipment, [equipmentSlot]: null },
      now,
      equipmentSlot === "ammo" ? 0 : getAmmoQuantityForSet(character, equipmentSet)
    );
    insertInventoryItems(id, [itemId], [slotIndex], now, [quantity]);
    return { character: characterCoreRepository.findById(id), error: null };
  },
  consumeEquippedArrowForPlayer(id: string, playerId: string, equipmentSet: EquipmentSetIndex = 0) {
    const character = characterCoreRepository.findById(id);
    if (!character || character.playerId !== playerId)
      return { character: null, error: "Character not found" };

    const equipment = getEquipmentForSet(character, equipmentSet);
    const equippedItems = findItemsByIds(
      [equipment.mainhand, equipment.ammo].filter((itemId): itemId is string => itemId !== null)
    );
    const mainhand = equippedItems.find((item) => item.id === equipment.mainhand);
    const ammo = equippedItems.find((item) => item.id === equipment.ammo);
    if (mainhand?.subcategory !== "bow") return { character: null, error: "Equipped weapon is not a bow" };
    if (!equipment.ammo || ammo?.category !== "arrow") {
      return { character: null, error: "Arrows must be equipped to attack with a bow" };
    }

    const currentQuantity = getAmmoQuantityForSet(character, equipmentSet);
    if (currentQuantity <= 0) return { character: null, error: "No equipped arrows remain" };

    const nextQuantity = currentQuantity - 1;
    persistEquipmentSet(
      id,
      character,
      equipmentSet,
      nextQuantity > 0 ? equipment : { ...equipment, ammo: null },
      new Date().toISOString(),
      nextQuantity
    );
    return { character: characterCoreRepository.findById(id), error: null };
  }
};
