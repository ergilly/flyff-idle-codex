import { characterReadRepository } from "./characterReadRepository.js";
import { db } from "./database.js";
import { applyCharacterExperience, getQuestExperienceGain } from "../characters/characterExperience.js";
import type { QuestCompletionPlan } from "../characters/questCompletionRules.js";

export const characterQuestRepository = {
  acceptForPlayer(characterId: string, playerId: string, questId: number) {
    const result = db
      .prepare(
        `INSERT INTO character_quests (character_id, quest_id, status, accepted_at)
         SELECT id, ?, 'active', ? FROM characters WHERE id = ? AND player_id = ?
         ON CONFLICT(character_id, quest_id) DO UPDATE SET
           status = 'active', accepted_at = excluded.accepted_at, completed_at = NULL
         WHERE character_quests.status = 'completed'`
      )
      .run(questId, new Date().toISOString(), characterId, playerId);

    return result.changes > 0 ? characterReadRepository.findById(characterId) : null;
  },
  abandonForPlayer(characterId: string, playerId: string, questId: number) {
    const result = db
      .prepare(
        `DELETE FROM character_quests
         WHERE character_id = ? AND quest_id = ? AND status = 'active'
           AND EXISTS (
             SELECT 1 FROM characters WHERE id = ? AND player_id = ?
           )`
      )
      .run(characterId, questId, characterId, playerId);

    return result.changes > 0 ? characterReadRepository.findById(characterId) : null;
  },
  completeForPlayer(characterId: string, playerId: string, questId: number, plan: QuestCompletionPlan) {
    try {
      db.exec("BEGIN IMMEDIATE");
      const character = characterReadRepository.findById(characterId);

      if (!character || character.playerId !== playerId) throw new Error("Character not found");

      const now = new Date().toISOString();
      assertInventoryItems(characterId, plan.requiredItems);
      removeInventoryItems(characterId, plan.removeItems, now);
      const experienceGain = getQuestExperienceGain(plan.experiencePercentages, character);
      const progression = applyCharacterExperience(character, experienceGain);
      db.prepare(
        `UPDATE characters
         SET level = ?, exp = ?, penya = penya + ?, updated_at = ?
         WHERE id = ? AND player_id = ?`
      ).run(progression.level, progression.exp, plan.penya, now, characterId, playerId);
      const completed = db
        .prepare(
          `UPDATE character_quests
           SET status = 'completed', completed_at = ?
           WHERE character_id = ? AND quest_id = ? AND status = 'active'`
        )
        .run(now, characterId, questId);

      if (completed.changes === 0) throw new Error("Active quest not found");

      db.exec("COMMIT");
      return {
        character: characterReadRepository.findById(characterId),
        error: null,
        experienceGain
      };
    } catch (error) {
      if (db.isTransaction) db.exec("ROLLBACK");
      return {
        character: null,
        error: error instanceof Error ? error.message : "Unable to complete quest",
        experienceGain: 0
      };
    }
  },
  getStatuses(characterId: string) {
    return db
      .prepare("SELECT quest_id AS questId, status FROM character_quests WHERE character_id = ?")
      .all(characterId) as Array<{ questId: number; status: "active" | "completed" }>;
  }
};

function removeInventoryItems(
  characterId: string,
  requirements: Array<{ itemId: string; quantity: number }>,
  now: string
) {
  const quantityByItemId = requirements.reduce<Map<string, number>>((quantities, requirement) => {
    quantities.set(requirement.itemId, (quantities.get(requirement.itemId) ?? 0) + requirement.quantity);
    return quantities;
  }, new Map());

  for (const [itemId, requiredQuantity] of quantityByItemId) {
    const stacks = db
      .prepare(
        `SELECT id, quantity FROM character_inventory_items
         WHERE character_id = ? AND item_id = ? ORDER BY slot_index ASC`
      )
      .all(characterId, itemId) as Array<{ id: string; quantity: number }>;
    let remainingQuantity = requiredQuantity;

    for (const stack of stacks) {
      const removedQuantity = Math.min(stack.quantity, remainingQuantity);
      const nextQuantity = stack.quantity - removedQuantity;

      if (nextQuantity === 0) {
        db.prepare("DELETE FROM character_inventory_items WHERE id = ?").run(stack.id);
      } else {
        db.prepare("UPDATE character_inventory_items SET quantity = ?, updated_at = ? WHERE id = ?").run(
          nextQuantity,
          now,
          stack.id
        );
      }
      remainingQuantity -= removedQuantity;
      if (remainingQuantity === 0) break;
    }

    if (remainingQuantity > 0) throw new Error("Required quest items have not been collected");
  }
}

function assertInventoryItems(
  characterId: string,
  requirements: Array<{ itemId: string; quantity: number }>
) {
  const quantityByItemId = requirements.reduce<Map<string, number>>((quantities, requirement) => {
    quantities.set(requirement.itemId, (quantities.get(requirement.itemId) ?? 0) + requirement.quantity);
    return quantities;
  }, new Map());

  const getQuantity = db.prepare(
    `SELECT COALESCE(SUM(quantity), 0) AS quantity
     FROM character_inventory_items WHERE character_id = ? AND item_id = ?`
  );
  for (const [itemId, requiredQuantity] of quantityByItemId) {
    const row = getQuantity.get(characterId, itemId) as { quantity: number };
    if (row.quantity < requiredQuantity) throw new Error("Required quest items have not been collected");
  }
}
