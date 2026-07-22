import { randomUUID } from "node:crypto";
import type { Character } from "../types.js";
import { createEmptyEquipment, createEquipmentSets } from "./characterEquipmentRepository.js";
import { characterReadRepository } from "./characterReadRepository.js";
import type { CreateCharacterInput } from "./characterRepository.types.js";
import { db } from "./database.js";
import { startingEquipmentByGender, startingInventoryItems, startingMainhand } from "./starterLoadout.js";

export const characterCoreRepository = {
  ...characterReadRepository,
  create({ playerId, slotIndex, name, gender }: CreateCharacterInput) {
    const now = new Date().toISOString();
    const id = randomUUID();
    const startingEquipment = startingEquipmentByGender[gender];
    const equipment = {
      ...createEmptyEquipment(),
      boots: startingEquipment.boots,
      gloves: startingEquipment.gloves,
      mainhand: startingMainhand,
      suit: startingEquipment.suit
    };
    const equipmentSets = createEquipmentSets(equipment);

    db.prepare(
      `INSERT INTO characters (
        id, player_id, slot_index, name, gender, job, progression_rank, location, level, exp, penya,
        inventory_size, str, sta, dex, int, consumable_loadout, equipment_sets, suit, gloves, boots,
        mainhand, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      playerId,
      slotIndex,
      name,
      gender,
      "Vagrant",
      "normal",
      "Flaris",
      1,
      0,
      0,
      50,
      15,
      15,
      15,
      15,
      "{}",
      JSON.stringify(equipmentSets),
      equipment.suit,
      equipment.gloves,
      equipment.boots,
      startingMainhand,
      now,
      now
    );

    const insertInventoryItem = db.prepare(
      "INSERT INTO character_inventory_items (id, character_id, slot_index, item_id, quantity, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
    );
    for (const item of startingInventoryItems) {
      insertInventoryItem.run(randomUUID(), id, item.slotIndex, item.itemId, item.quantity, now, now);
    }

    return characterReadRepository.findById(id);
  },
  deleteByIdForPlayer(id: string, playerId: string) {
    return db.prepare("DELETE FROM characters WHERE id = ? AND player_id = ?").run(id, playerId).changes > 0;
  },
  refundStatsForPlayer(id: string, playerId: string) {
    const result = db
      .prepare(
        "UPDATE characters SET str = 15, sta = 15, dex = 15, int = 15, updated_at = ? WHERE id = ? AND player_id = ?"
      )
      .run(new Date().toISOString(), id, playerId);
    return result.changes > 0 ? characterReadRepository.findById(id) : null;
  },
  refundSkillsForPlayer(id: string, playerId: string) {
    const result = db
      .prepare("UPDATE characters SET skill_levels = '{}', updated_at = ? WHERE id = ? AND player_id = ?")
      .run(new Date().toISOString(), id, playerId);
    return result.changes > 0 ? characterReadRepository.findById(id) : null;
  },
  addPenyaForPlayer(id: string, playerId: string, amount: number) {
    const result = db
      .prepare("UPDATE characters SET penya = penya + ?, updated_at = ? WHERE id = ? AND player_id = ?")
      .run(amount, new Date().toISOString(), id, playerId);
    return result.changes > 0 ? characterReadRepository.findById(id) : null;
  },
  updateStatsForPlayer(id: string, playerId: string, stats: Character["stats"]) {
    const result = db
      .prepare(
        "UPDATE characters SET str = ?, sta = ?, dex = ?, int = ?, updated_at = ? WHERE id = ? AND player_id = ?"
      )
      .run(stats.str, stats.sta, stats.dex, stats.int, new Date().toISOString(), id, playerId);
    return result.changes > 0 ? characterReadRepository.findById(id) : null;
  },
  updateSkillLevelsForPlayer(id: string, playerId: string, skillLevels: Character["skillLevels"]) {
    const result = db
      .prepare("UPDATE characters SET skill_levels = ?, updated_at = ? WHERE id = ? AND player_id = ?")
      .run(JSON.stringify(skillLevels), new Date().toISOString(), id, playerId);
    return result.changes > 0 ? characterReadRepository.findById(id) : null;
  },
  updateProgressionForPlayer(
    id: string,
    playerId: string,
    progression: {
      exp?: number;
      level?: number;
      penya?: number;
      skillLevels?: Character["skillLevels"];
      stats?: Character["stats"];
    }
  ) {
    const character = characterReadRepository.findById(id);
    if (!character || character.playerId !== playerId) return null;

    const nextStats = progression.stats ?? character.stats;
    const nextSkillLevels = progression.skillLevels ?? character.skillLevels;
    db.prepare(
      `UPDATE characters SET str = ?, sta = ?, dex = ?, int = ?, level = ?, exp = ?, penya = ?,
       skill_levels = ?, updated_at = ? WHERE id = ? AND player_id = ?`
    ).run(
      nextStats.str,
      nextStats.sta,
      nextStats.dex,
      nextStats.int,
      progression.level ?? character.level,
      progression.exp ?? character.exp,
      progression.penya ?? character.penya,
      JSON.stringify(nextSkillLevels),
      new Date().toISOString(),
      id,
      playerId
    );
    return characterReadRepository.findById(id);
  }
};
