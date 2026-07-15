import { db } from "./database.js";
import { characterCoreRepository } from "./characterCoreRepository.js";
import type { CharacterConsumableResource } from "../types.js";
import { findItemsByIds } from "../items/itemIconRepository.js";
import {
  getEquipmentForSet,
  getEquipmentRequirementError,
  getRecoveryAbility,
  isRecoveryCategory,
  persistConsumableLoadout,
  persistEquipmentSet
} from "./characterEquipmentRepository.js";
import {
  addInventoryQuantity,
  compareInventoryItems,
  getEquipmentSlotForItem,
  getMaxStackSize,
  getOpenInventorySlots,
  insertInventoryItems,
  reassignInventorySlots,
  setInventorySlot,
  swapInventorySlots
} from "./characterInventoryRepository.js";
import {
  type EquipmentSlot,
  type EquipmentSetIndex,
  type InventorySortOption
} from "./characterRepository.types.js";

export const characterInventoryOperations = {
  setInventoryItemForPlayer(
    id: string,
    playerId: string,
    inventoryItem: { itemId: string; quantity: number; slotIndex?: number }
  ) {
    const character = characterCoreRepository.findById(id);

    if (!character || character.playerId !== playerId) {
      return null;
    }

    const now = new Date().toISOString();

    if (inventoryItem.slotIndex !== undefined) {
      if (
        !setInventorySlot(character, playerId, { ...inventoryItem, slotIndex: inventoryItem.slotIndex }, now)
      ) {
        return null;
      }

      return characterCoreRepository.findById(id);
    }

    const added = addInventoryQuantity(id, character, inventoryItem.itemId, inventoryItem.quantity, now);

    if (!added) {
      return null;
    }

    return characterCoreRepository.findById(id);
  },
  addInventoryItemsForPlayer(
    id: string,
    playerId: string,
    inventoryItems: Array<{ itemId: string; quantity: number }>
  ) {
    try {
      db.exec("BEGIN");
      const character = characterCoreRepository.findById(id);

      if (!character || character.playerId !== playerId) {
        db.exec("ROLLBACK");
        return { character: null, error: "Character not found" };
      }

      const now = new Date().toISOString();

      for (const inventoryItem of inventoryItems) {
        const currentCharacter = characterCoreRepository.findById(id);

        if (
          !currentCharacter ||
          !addInventoryQuantity(id, currentCharacter, inventoryItem.itemId, inventoryItem.quantity, now)
        ) {
          throw new Error("Not enough inventory space");
        }
      }

      db.exec("COMMIT");

      return { character: characterCoreRepository.findById(id), error: null };
    } catch (error) {
      if (db.isTransaction) {
        db.exec("ROLLBACK");
      }

      return {
        character: null,
        error: error instanceof Error ? error.message : "Unable to add inventory items"
      };
    }
  },
  moveInventoryItemForPlayer(id: string, playerId: string, fromSlotIndex: number, toSlotIndex: number) {
    const character = characterCoreRepository.findById(id);

    if (!character || character.playerId !== playerId) {
      return { character: null, error: "Character not found" };
    }

    if (fromSlotIndex === toSlotIndex) {
      return { character, error: null };
    }

    if (toSlotIndex >= character.inventory.size) {
      return { character: null, error: "Destination slot is outside inventory capacity" };
    }

    const sourceItem = character.inventory.items.find((item) => item.slotIndex === fromSlotIndex);

    if (!sourceItem) {
      return { character: null, error: "Inventory item not found" };
    }

    const targetItem = character.inventory.items.find((item) => item.slotIndex === toSlotIndex);
    const now = new Date().toISOString();

    if (!targetItem) {
      db.prepare(
        "UPDATE character_inventory_items SET slot_index = ?, updated_at = ? WHERE character_id = ? AND slot_index = ?"
      ).run(toSlotIndex, now, id, fromSlotIndex);
      return { character: characterCoreRepository.findById(id), error: null };
    }

    if (targetItem.itemId === sourceItem.itemId) {
      const maxStackSize = getMaxStackSize(sourceItem.itemId);
      const availableQuantity = maxStackSize - targetItem.quantity;

      if (availableQuantity > 0) {
        const movedQuantity = Math.min(availableQuantity, sourceItem.quantity);
        const remainingQuantity = sourceItem.quantity - movedQuantity;

        db.prepare(
          "UPDATE character_inventory_items SET quantity = ?, updated_at = ? WHERE character_id = ? AND slot_index = ?"
        ).run(targetItem.quantity + movedQuantity, now, id, toSlotIndex);

        if (remainingQuantity > 0) {
          db.prepare(
            "UPDATE character_inventory_items SET quantity = ?, updated_at = ? WHERE character_id = ? AND slot_index = ?"
          ).run(remainingQuantity, now, id, fromSlotIndex);
        } else {
          db.prepare("DELETE FROM character_inventory_items WHERE character_id = ? AND slot_index = ?").run(
            id,
            fromSlotIndex
          );
        }

        return { character: characterCoreRepository.findById(id), error: null };
      }
    }

    swapInventorySlots(id, fromSlotIndex, toSlotIndex, now);
    return { character: characterCoreRepository.findById(id), error: null };
  },
  consumeInventoryItemForPlayer(id: string, playerId: string, slotIndex: number) {
    const character = characterCoreRepository.findById(id);

    if (!character || character.playerId !== playerId) {
      return { character: null, error: "Character not found" };
    }

    const inventoryItem = character.inventory.items.find((item) => item.slotIndex === slotIndex);

    if (!inventoryItem) {
      return { character: null, error: "Inventory item not found" };
    }

    const now = new Date().toISOString();

    if (inventoryItem.quantity > 1) {
      db.prepare(
        "UPDATE character_inventory_items SET quantity = ?, updated_at = ? WHERE character_id = ? AND slot_index = ?"
      ).run(inventoryItem.quantity - 1, now, id, slotIndex);
    } else {
      db.prepare("DELETE FROM character_inventory_items WHERE character_id = ? AND slot_index = ?").run(
        id,
        slotIndex
      );
    }

    return { character: characterCoreRepository.findById(id), error: null };
  },
  sortInventoryForPlayer(id: string, playerId: string, sortBy: InventorySortOption) {
    const character = characterCoreRepository.findById(id);

    if (!character || character.playerId !== playerId) {
      return null;
    }

    const sortedItems = [...character.inventory.items].sort((first, second) =>
      compareInventoryItems(first, second, sortBy)
    );
    const now = new Date().toISOString();

    reassignInventorySlots(
      id,
      sortedItems.map((item, index) => ({ fromSlotIndex: item.slotIndex, toSlotIndex: index })),
      now
    );

    return characterCoreRepository.findById(id);
  },
  equipInventoryItemForPlayer(
    id: string,
    playerId: string,
    slotIndex: number,
    equipmentSet: EquipmentSetIndex = 0
  ) {
    const character = characterCoreRepository.findById(id);

    if (!character || character.playerId !== playerId) {
      return { character: null, error: "Character not found" };
    }

    const inventoryItem = character.inventory.items.find((item) => item.slotIndex === slotIndex);

    if (!inventoryItem) {
      return { character: null, error: "Inventory item not found" };
    }

    const [item] = findItemsByIds([inventoryItem.itemId]);

    if (!item) {
      return { character: null, error: "Item not found" };
    }

    const requirementError = getEquipmentRequirementError(character, item);

    if (requirementError) {
      return { character: null, error: requirementError };
    }

    const targetEquipment = getEquipmentForSet(character, equipmentSet);
    const equipmentSlot = getEquipmentSlotForItem(character, item, targetEquipment);

    if (!equipmentSlot) {
      return { character: null, error: "That item cannot be equipped" };
    }

    if (equipmentSlot === "offhand" && targetEquipment.mainhand) {
      const [mainhandItem] = findItemsByIds([targetEquipment.mainhand]);

      if (mainhandItem?.twoHanded) {
        return { character: null, error: "Unequip your two-handed weapon first" };
      }
    }

    const now = new Date().toISOString();
    const returnedItemIds = [
      targetEquipment[equipmentSlot],
      equipmentSlot === "mainhand" && item.twoHanded ? targetEquipment.offhand : null
    ].filter((itemId): itemId is string => Boolean(itemId));
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

    persistEquipmentSet(id, character, equipmentSet, nextEquipment, now);

    insertInventoryItems(id, returnedItemIds, inventorySlotsToUse, now);

    return { character: characterCoreRepository.findById(id), error: null };
  },
  unequipItemForPlayer(
    id: string,
    playerId: string,
    equipmentSlot: EquipmentSlot,
    equipmentSet: EquipmentSetIndex = 0
  ) {
    const character = characterCoreRepository.findById(id);

    if (!character || character.playerId !== playerId) {
      return { character: null, error: "Character not found" };
    }

    const targetEquipment = getEquipmentForSet(character, equipmentSet);
    const itemId = targetEquipment[equipmentSlot];

    if (!itemId) {
      return { character: null, error: "Equipment slot is empty" };
    }

    const [slotIndex] = getOpenInventorySlots(character);

    if (slotIndex === undefined) {
      return { character: null, error: "Inventory is full" };
    }

    const now = new Date().toISOString();

    persistEquipmentSet(id, character, equipmentSet, { ...targetEquipment, [equipmentSlot]: null }, now);
    insertInventoryItems(id, [itemId], [slotIndex], now);

    return { character: characterCoreRepository.findById(id), error: null };
  },
  equipConsumableItemForPlayer(
    id: string,
    playerId: string,
    resource: CharacterConsumableResource,
    slotIndex: number | null
  ) {
    const character = characterCoreRepository.findById(id);

    if (!character || character.playerId !== playerId) {
      return { character: null, error: "Character not found" };
    }

    const now = new Date().toISOString();
    const currentConsumable = character.consumableLoadout[resource];

    if (slotIndex === null) {
      if (!currentConsumable) {
        return { character, error: null };
      }

      if (
        !addInventoryQuantity(id, character, currentConsumable.itemId, currentConsumable.quantity, now, {
          stackIntoEquippedConsumables: false
        })
      ) {
        return { character: null, error: "Inventory is full" };
      }

      persistConsumableLoadout(id, { ...character.consumableLoadout, [resource]: null }, now);
      return { character: characterCoreRepository.findById(id), error: null };
    }

    const inventoryItem = character.inventory.items.find((item) => item.slotIndex === slotIndex);

    if (!inventoryItem) {
      return { character: null, error: "Inventory item not found" };
    }

    const [item] = findItemsByIds([inventoryItem.itemId]);

    if (!item) {
      return { character: null, error: "Item not found" };
    }

    if (!isRecoveryCategory(item) || !getRecoveryAbility(item, resource)) {
      return { character: null, error: "That item cannot be equipped as this consumable" };
    }

    const maxStackSize = getMaxStackSize(inventoryItem.itemId);
    const combinedConsumableQuantity =
      currentConsumable?.itemId === inventoryItem.itemId
        ? currentConsumable.quantity + inventoryItem.quantity
        : null;

    if (combinedConsumableQuantity !== null && combinedConsumableQuantity > maxStackSize) {
      return { character: null, error: "Equipped consumable stack is full" };
    }

    try {
      db.exec("BEGIN");

      db.prepare("DELETE FROM character_inventory_items WHERE character_id = ? AND slot_index = ?").run(
        id,
        slotIndex
      );

      if (combinedConsumableQuantity !== null) {
        persistConsumableLoadout(
          id,
          {
            ...character.consumableLoadout,
            [resource]: {
              itemId: inventoryItem.itemId,
              quantity: combinedConsumableQuantity
            }
          },
          now
        );
        db.exec("COMMIT");
        return { character: characterCoreRepository.findById(id), error: null };
      }

      const characterWithoutEquippedStack = characterCoreRepository.findById(id);

      if (
        currentConsumable &&
        (!characterWithoutEquippedStack ||
          !addInventoryQuantity(
            id,
            characterWithoutEquippedStack,
            currentConsumable.itemId,
            currentConsumable.quantity,
            now,
            { stackIntoEquippedConsumables: false }
          ))
      ) {
        throw new Error("Inventory is full");
      }

      persistConsumableLoadout(
        id,
        {
          ...character.consumableLoadout,
          [resource]: {
            itemId: inventoryItem.itemId,
            quantity: inventoryItem.quantity
          }
        },
        now
      );

      db.exec("COMMIT");
    } catch (error) {
      if (db.isTransaction) {
        db.exec("ROLLBACK");
      }

      return {
        character: null,
        error: error instanceof Error ? error.message : "Unable to equip consumable"
      };
    }

    return { character: characterCoreRepository.findById(id), error: null };
  },
  consumeEquippedConsumableForPlayer(id: string, playerId: string, resource: CharacterConsumableResource) {
    const character = characterCoreRepository.findById(id);

    if (!character || character.playerId !== playerId) {
      return { character: null, error: "Character not found" };
    }

    const consumable = character.consumableLoadout[resource];

    if (!consumable) {
      return { character: null, error: "Consumable slot is empty" };
    }

    const now = new Date().toISOString();
    const nextConsumable =
      consumable.quantity > 1 ? { ...consumable, quantity: consumable.quantity - 1 } : null;

    persistConsumableLoadout(id, { ...character.consumableLoadout, [resource]: nextConsumable }, now);

    return { character: characterCoreRepository.findById(id), error: null };
  }
};
