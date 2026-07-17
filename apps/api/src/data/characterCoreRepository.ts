import { randomUUID } from "node:crypto";
import { db } from "./database.js";
import { startingEquipmentByGender, startingInventoryItems, startingMainhand } from "./starterLoadout.js";
import type { Character } from "../types.js";
import {
  createEmptyEquipment,
  createEquipmentSets,
  parseConsumableLoadout,
  parseEquipmentSets,
  parseSkillLevels
} from "./characterEquipmentRepository.js";
import {
  type CharacterRow,
  type CreateCharacterInput,
  type InventoryItemRow
} from "./characterRepository.types.js";

export const characterCoreRepository = {
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
        id,
        player_id,
        slot_index,
        name,
        gender,
        job,
        progression_rank,
        location,
        level,
        exp,
        penya,
        inventory_size,
        str,
        sta,
        dex,
        int,
        consumable_loadout,
        equipment_sets,
        suit,
        gloves,
        boots,
        mainhand,
        created_at,
        updated_at
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

    return this.findById(id);
  },
  deleteByIdForPlayer(id: string, playerId: string) {
    const result = db.prepare("DELETE FROM characters WHERE id = ? AND player_id = ?").run(id, playerId);

    return result.changes > 0;
  },
  refundStatsForPlayer(id: string, playerId: string) {
    const now = new Date().toISOString();
    const result = db
      .prepare(
        `UPDATE characters
          SET str = 15,
              sta = 15,
              dex = 15,
              int = 15,
              updated_at = ?
          WHERE id = ? AND player_id = ?`
      )
      .run(now, id, playerId);

    return result.changes > 0 ? this.findById(id) : null;
  },
  refundSkillsForPlayer(id: string, playerId: string) {
    const now = new Date().toISOString();
    const result = db
      .prepare(
        `UPDATE characters
          SET skill_levels = '{}',
              updated_at = ?
          WHERE id = ? AND player_id = ?`
      )
      .run(now, id, playerId);

    return result.changes > 0 ? this.findById(id) : null;
  },
  addPenyaForPlayer(id: string, playerId: string, amount: number) {
    const now = new Date().toISOString();
    const result = db
      .prepare("UPDATE characters SET penya = penya + ?, updated_at = ? WHERE id = ? AND player_id = ?")
      .run(amount, now, id, playerId);

    return result.changes > 0 ? this.findById(id) : null;
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
    const character = this.findById(id);

    if (!character || character.playerId !== playerId) {
      return null;
    }

    const nextStats = progression.stats ?? character.stats;
    const nextSkillLevels = progression.skillLevels ?? character.skillLevels;
    const nextLevel = progression.level ?? character.level;
    const nextExp = progression.exp ?? character.exp;
    const nextPenya = progression.penya ?? character.penya;
    const now = new Date().toISOString();

    db.prepare(
      `UPDATE characters
        SET str = ?,
            sta = ?,
            dex = ?,
            int = ?,
            level = ?,
            exp = ?,
            penya = ?,
            skill_levels = ?,
            updated_at = ?
        WHERE id = ? AND player_id = ?`
    ).run(
      nextStats.str,
      nextStats.sta,
      nextStats.dex,
      nextStats.int,
      nextLevel,
      nextExp,
      nextPenya,
      JSON.stringify(nextSkillLevels),
      now,
      id,
      playerId
    );

    return this.findById(id);
  },
  findById(id: string) {
    const characters = this.listByIds([id]);

    return characters[0] ?? null;
  },
  listByPlayerId(playerId: string) {
    const rows = db
      .prepare(
        `SELECT
          id,
          player_id AS playerId,
          slot_index AS slotIndex,
          name,
          gender,
          job,
          progression_rank AS progressionRank,
          location,
          level,
          exp,
          penya,
          inventory_size AS inventorySize,
          str,
          sta,
          dex,
          int,
          skill_levels AS skillLevels,
          consumable_loadout AS consumableLoadout,
          equipment_sets AS equipmentSets,
          helmet,
          suit,
          gloves,
          boots,
          flying,
          cs_boots AS csBoots,
          cs_gloves AS csGloves,
          cs_suit AS csSuit,
          cs_helm AS csHelm,
          mask,
          cloak,
          ammo,
          offhand,
          mainhand,
          ring_r AS ringR,
          earring_r AS earringR,
          necklace,
          earring_l AS earringL,
          ring_l AS ringL
        FROM characters
        WHERE player_id = ?
        ORDER BY slot_index ASC`
      )
      .all(playerId) as CharacterRow[];
    return this.mapRows(rows);
  },
  listByIds(ids: string[]) {
    if (ids.length === 0) {
      return [];
    }

    const rows = db
      .prepare(
        `SELECT
          id,
          player_id AS playerId,
          slot_index AS slotIndex,
          name,
          gender,
          job,
          progression_rank AS progressionRank,
          location,
          level,
          exp,
          penya,
          inventory_size AS inventorySize,
          str,
          sta,
          dex,
          int,
          skill_levels AS skillLevels,
          consumable_loadout AS consumableLoadout,
          equipment_sets AS equipmentSets,
          helmet,
          suit,
          gloves,
          boots,
          flying,
          cs_boots AS csBoots,
          cs_gloves AS csGloves,
          cs_suit AS csSuit,
          cs_helm AS csHelm,
          mask,
          cloak,
          ammo,
          offhand,
          mainhand,
          ring_r AS ringR,
          earring_r AS earringR,
          necklace,
          earring_l AS earringL,
          ring_l AS ringL
        FROM characters
        WHERE id IN (${ids.map(() => "?").join(",")})
        ORDER BY slot_index ASC`
      )
      .all(...ids) as CharacterRow[];

    return this.mapRows(rows);
  },
  mapRows(rows: CharacterRow[]) {
    const characterIds = rows.map((row) => row.id);
    const inventoryItems =
      characterIds.length > 0
        ? (db
            .prepare(
              `SELECT
                id,
                character_id AS characterId,
                slot_index AS slotIndex,
                item_id AS itemId,
                quantity
              FROM character_inventory_items
              WHERE character_id IN (${characterIds.map(() => "?").join(",")})
              ORDER BY slot_index ASC`
            )
            .all(...characterIds) as InventoryItemRow[])
        : [];
    const inventoryItemsByCharacterId = new Map<string, InventoryItemRow[]>();

    for (const item of inventoryItems) {
      inventoryItemsByCharacterId.set(item.characterId, [
        ...(inventoryItemsByCharacterId.get(item.characterId) ?? []),
        item
      ]);
    }

    return rows.map(
      ({
        id,
        str,
        sta,
        dex,
        int,
        skillLevels,
        consumableLoadout,
        equipmentSets,
        helmet,
        suit,
        gloves,
        boots,
        flying,
        csBoots,
        csGloves,
        csSuit,
        csHelm,
        mask,
        cloak,
        ammo,
        offhand,
        mainhand,
        ringR,
        earringR,
        necklace,
        earringL,
        ringL,
        inventorySize,
        ...character
      }): Character => {
        const equipment = {
          helmet,
          suit,
          gloves,
          boots,
          flying,
          csBoots,
          csGloves,
          csSuit,
          csHelm,
          mask,
          cloak,
          ammo,
          offhand,
          mainhand,
          ringR,
          earringR,
          necklace,
          earringL,
          ringL
        };

        return {
          id,
          ...character,
          stats: {
            str,
            sta,
            dex,
            int
          },
          skillLevels: parseSkillLevels(skillLevels),
          consumableLoadout: parseConsumableLoadout(consumableLoadout),
          equipment,
          equipmentSets: parseEquipmentSets(equipmentSets, equipment),
          inventory: {
            size: inventorySize,
            items: (inventoryItemsByCharacterId.get(id) ?? []).map(
              ({ characterId: _characterId, id: _id, ...item }) => item
            )
          }
        };
      }
    );
  }
};
