import type { CharacterConsumableResource } from "../types.js";
import { findItemsByIds } from "../items/itemIconRepository.js";
import {
  getRecoveryAbility,
  isRecoveryCategory,
  persistConsumableLoadout
} from "./characterEquipmentRepository.js";
import { characterCoreRepository } from "./characterCoreRepository.js";
import { addInventoryQuantity, getMaxStackSize } from "./characterInventoryRepository.js";
import { db } from "./database.js";

export const characterConsumableOperations = {
  equipConsumableItemForPlayer(
    id: string,
    playerId: string,
    resource: CharacterConsumableResource,
    slotIndex: number | null
  ) {
    const character = characterCoreRepository.findById(id);
    if (!character || character.playerId !== playerId)
      return { character: null, error: "Character not found" };

    const now = new Date().toISOString();
    const currentConsumable = character.consumableLoadout[resource];
    if (slotIndex === null) {
      if (!currentConsumable) return { character, error: null };
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
    if (!inventoryItem) return { character: null, error: "Inventory item not found" };

    const [item] = findItemsByIds([inventoryItem.itemId]);
    if (!item) return { character: null, error: "Item not found" };
    if (!isRecoveryCategory(item) || !getRecoveryAbility(item, resource)) {
      return { character: null, error: "That item cannot be equipped as this consumable" };
    }

    const combinedQuantity =
      currentConsumable?.itemId === inventoryItem.itemId
        ? currentConsumable.quantity + inventoryItem.quantity
        : null;
    if (combinedQuantity !== null && combinedQuantity > getMaxStackSize(inventoryItem.itemId)) {
      return { character: null, error: "Equipped consumable stack is full" };
    }

    try {
      db.exec("BEGIN");
      db.prepare("DELETE FROM character_inventory_items WHERE character_id = ? AND slot_index = ?").run(
        id,
        slotIndex
      );

      if (combinedQuantity !== null) {
        persistConsumableLoadout(
          id,
          {
            ...character.consumableLoadout,
            [resource]: { itemId: inventoryItem.itemId, quantity: combinedQuantity }
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
          [resource]: { itemId: inventoryItem.itemId, quantity: inventoryItem.quantity }
        },
        now
      );
      db.exec("COMMIT");
    } catch (error) {
      if (db.isTransaction) db.exec("ROLLBACK");
      return {
        character: null,
        error: error instanceof Error ? error.message : "Unable to equip consumable"
      };
    }

    return { character: characterCoreRepository.findById(id), error: null };
  },
  consumeEquippedConsumableForPlayer(id: string, playerId: string, resource: CharacterConsumableResource) {
    const character = characterCoreRepository.findById(id);
    if (!character || character.playerId !== playerId)
      return { character: null, error: "Character not found" };

    const consumable = character.consumableLoadout[resource];
    if (!consumable) return { character: null, error: "Consumable slot is empty" };

    const nextConsumable =
      consumable.quantity > 1 ? { ...consumable, quantity: consumable.quantity - 1 } : null;
    persistConsumableLoadout(
      id,
      { ...character.consumableLoadout, [resource]: nextConsumable },
      new Date().toISOString()
    );
    return { character: characterCoreRepository.findById(id), error: null };
  }
};
