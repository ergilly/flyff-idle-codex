import { db } from "./database.js";
import { characterCoreRepository } from "./characterCoreRepository.js";
import {
  addInventoryQuantity,
  getMaxStackSize,
  reassignInventorySlots,
  setInventorySlot,
  swapInventorySlots
} from "./characterInventoryRepository.js";
import { compareInventoryItems } from "./characterInventoryRules.js";
import type { InventorySortOption } from "./characterRepository.types.js";

export const characterInventoryOperations = {
  sellInventoryItemForPlayer(
    id: string,
    playerId: string,
    slotIndex: number,
    quantity: number,
    unitPrice: number
  ) {
    try {
      db.exec("BEGIN");
      const character = characterCoreRepository.findById(id);
      const inventoryItem = character?.inventory.items.find((item) => item.slotIndex === slotIndex);

      if (!character || character.playerId !== playerId) throw new Error("Character not found");
      if (!inventoryItem) throw new Error("Inventory item not found");
      if (quantity > inventoryItem.quantity) throw new Error("Not enough items in this stack");

      const now = new Date().toISOString();
      if (quantity === inventoryItem.quantity) {
        db.prepare("DELETE FROM character_inventory_items WHERE character_id = ? AND slot_index = ?").run(
          id,
          slotIndex
        );
      } else {
        db.prepare(
          "UPDATE character_inventory_items SET quantity = quantity - ?, updated_at = ? WHERE character_id = ? AND slot_index = ?"
        ).run(quantity, now, id, slotIndex);
      }
      db.prepare(
        "UPDATE characters SET penya = penya + ?, updated_at = ? WHERE id = ? AND player_id = ?"
      ).run(unitPrice * quantity, now, id, playerId);
      db.exec("COMMIT");
      return { character: characterCoreRepository.findById(id), error: null };
    } catch (error) {
      if (db.isTransaction) db.exec("ROLLBACK");
      return { character: null, error: error instanceof Error ? error.message : "Unable to sell item" };
    }
  },
  purchaseInventoryItemForPlayer(
    id: string,
    playerId: string,
    itemId: string,
    quantity: number,
    unitPrice: number,
    maxStackSize: number
  ) {
    try {
      db.exec("BEGIN");
      const character = characterCoreRepository.findById(id);

      if (!character || character.playerId !== playerId) {
        db.exec("ROLLBACK");
        return { character: null, error: "Character not found" };
      }

      const totalPrice = unitPrice * quantity;

      if (character.penya < totalPrice) {
        db.exec("ROLLBACK");
        return { character: null, error: "Not enough Penya" };
      }

      const now = new Date().toISOString();

      if (!addInventoryQuantity(id, character, itemId, quantity, now, { maxStackSize })) {
        throw new Error("Not enough inventory space");
      }

      db.prepare(
        "UPDATE characters SET penya = penya - ?, updated_at = ? WHERE id = ? AND player_id = ?"
      ).run(totalPrice, now, id, playerId);
      db.exec("COMMIT");

      return { character: characterCoreRepository.findById(id), error: null };
    } catch (error) {
      if (db.isTransaction) {
        db.exec("ROLLBACK");
      }

      return {
        character: null,
        error: error instanceof Error ? error.message : "Unable to purchase item"
      };
    }
  },
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
  }
};
