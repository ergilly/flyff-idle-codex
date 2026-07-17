import { db } from "./database.js";
import { characterCoreRepository } from "./characterCoreRepository.js";
import { getEquipmentForSet } from "./characterEquipmentRepository.js";
import { getFlyingItemTier } from "./flyingItemProgression.js";
import type { EquipmentSetIndex } from "./characterRepository.types.js";
import { travelDestinations, type TravelDestinationId, type TravelMethod } from "../travel/travelRules.js";

export const characterTravelRepository = {
  travelForPlayer(
    id: string,
    playerId: string,
    destinationId: TravelDestinationId,
    method: TravelMethod,
    equipmentSet: EquipmentSetIndex
  ) {
    try {
      db.exec("BEGIN");
      const character = characterCoreRepository.findById(id);

      if (!character || character.playerId !== playerId) {
        throw new Error("Character not found");
      }

      const destination = travelDestinations[destinationId];
      const now = new Date().toISOString();

      if (character.location === destination.label) {
        db.exec("COMMIT");
        return { character, error: null };
      }

      if (method === "flying") {
        const flyingItemId = getEquipmentForSet(character, equipmentSet).flying;
        const flyingTier = getFlyingItemTier(flyingItemId);

        if (flyingTier < destination.requiredFlyingTier) {
          throw new Error(`A tier ${destination.requiredFlyingTier} flying item is required`);
        }
      } else {
        if (!destination.blinkwing) {
          throw new Error(`${destination.label} cannot be reached by Blinkwing`);
        }

        const blinkwing = character.inventory.items.find(
          (item) => item.itemId === destination.blinkwing?.id && item.quantity > 0
        );

        if (!blinkwing) {
          throw new Error(`${destination.blinkwing.name} is required`);
        }

        if (blinkwing.quantity === 1) {
          db.prepare("DELETE FROM character_inventory_items WHERE character_id = ? AND slot_index = ?").run(
            id,
            blinkwing.slotIndex
          );
        } else {
          db.prepare(
            "UPDATE character_inventory_items SET quantity = quantity - 1, updated_at = ? WHERE character_id = ? AND slot_index = ?"
          ).run(now, id, blinkwing.slotIndex);
        }
      }

      db.prepare("UPDATE characters SET location = ?, updated_at = ? WHERE id = ? AND player_id = ?").run(
        destination.label,
        now,
        id,
        playerId
      );
      db.exec("COMMIT");
      return { character: characterCoreRepository.findById(id), error: null };
    } catch (error) {
      if (db.isTransaction) db.exec("ROLLBACK");
      return { character: null, error: error instanceof Error ? error.message : "Unable to travel" };
    }
  }
};
