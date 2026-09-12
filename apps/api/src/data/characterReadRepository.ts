import type { Character } from "../types.js";
import {
  parseAmmoQuantities,
  parseConsumableLoadout,
  parseEquipmentSets,
  parseSkillLevels
} from "./characterEquipmentRepository.js";
import type { CharacterRow, InventoryItemRow } from "./characterRepository.types.js";
import { db } from "./database.js";

const characterColumns = `
  id, player_id AS playerId, slot_index AS slotIndex, name, gender, job,
  progression_rank AS progressionRank, location, level, exp, penya, inventory_size AS inventorySize,
  str, sta, dex, int, skill_levels AS skillLevels, consumable_loadout AS consumableLoadout,
  equipment_sets AS equipmentSets, ammo_quantity AS ammoQuantity, ammo_quantities AS ammoQuantities,
  helmet, suit, gloves, boots, flying, cs_boots AS csBoots, cs_gloves AS csGloves,
  cs_suit AS csSuit, cs_helm AS csHelm, mask, cloak, ammo, offhand, mainhand,
  ring_r AS ringR, earring_r AS earringR, necklace, earring_l AS earringL, ring_l AS ringL`;

export const characterReadRepository = {
  findById(id: string) {
    return this.listByIds([id])[0] ?? null;
  },
  listByPlayerId(playerId: string) {
    const rows = db
      .prepare(`SELECT ${characterColumns} FROM characters WHERE player_id = ? ORDER BY slot_index ASC`)
      .all(playerId) as CharacterRow[];
    return mapCharacterRows(rows);
  },
  listByIds(ids: string[]) {
    if (ids.length === 0) return [];

    const rows = db
      .prepare(
        `SELECT ${characterColumns} FROM characters WHERE id IN (${ids.map(() => "?").join(",")}) ORDER BY slot_index ASC`
      )
      .all(...ids) as CharacterRow[];
    return mapCharacterRows(rows);
  }
};

function mapCharacterRows(rows: CharacterRow[]): Character[] {
  const characterIds = rows.map((row) => row.id);
  const inventoryItems = characterIds.length
    ? (db
        .prepare(
          `SELECT id, character_id AS characterId, slot_index AS slotIndex, item_id AS itemId, quantity
           FROM character_inventory_items WHERE character_id IN (${characterIds.map(() => "?").join(",")})
           ORDER BY slot_index ASC`
        )
        .all(...characterIds) as InventoryItemRow[])
    : [];
  const inventoryItemsByCharacterId = new Map<string, InventoryItemRow[]>();
  const activeQuestIdsByCharacterId = new Map<string, number[]>();
  const completedQuestIdsByCharacterId = new Map<string, number[]>();

  const questRows = characterIds.length
    ? (db
        .prepare(
          `SELECT character_id AS characterId, quest_id AS questId, status
           FROM character_quests
           WHERE character_id IN (${characterIds.map(() => "?").join(",")})
           ORDER BY accepted_at ASC`
        )
        .all(...characterIds) as Array<{
        characterId: string;
        questId: number;
        status: "active" | "completed";
      }>)
    : [];

  for (const item of inventoryItems) {
    const characterItems = inventoryItemsByCharacterId.get(item.characterId) ?? [];
    characterItems.push(item);
    inventoryItemsByCharacterId.set(item.characterId, characterItems);
  }

  for (const quest of questRows) {
    const questIdsByCharacterId =
      quest.status === "active" ? activeQuestIdsByCharacterId : completedQuestIdsByCharacterId;
    const questIds = questIdsByCharacterId.get(quest.characterId) ?? [];
    questIds.push(quest.questId);
    questIdsByCharacterId.set(quest.characterId, questIds);
  }

  return rows.map((row) =>
    mapCharacterRow(
      row,
      inventoryItemsByCharacterId.get(row.id) ?? [],
      activeQuestIdsByCharacterId.get(row.id) ?? [],
      completedQuestIdsByCharacterId.get(row.id) ?? []
    )
  );
}

function mapCharacterRow(
  row: CharacterRow,
  inventoryItems: InventoryItemRow[],
  activeQuestIds: number[],
  completedQuestIds: number[]
): Character {
  const {
    id,
    str,
    sta,
    dex,
    int,
    skillLevels,
    consumableLoadout,
    equipmentSets,
    ammoQuantity,
    ammoQuantities,
    inventorySize,
    ...character
  } = row;
  const equipment = {
    helmet: row.helmet,
    suit: row.suit,
    gloves: row.gloves,
    boots: row.boots,
    flying: row.flying,
    csBoots: row.csBoots,
    csGloves: row.csGloves,
    csSuit: row.csSuit,
    csHelm: row.csHelm,
    mask: row.mask,
    cloak: row.cloak,
    ammo: row.ammo,
    offhand: row.offhand,
    mainhand: row.mainhand,
    ringR: row.ringR,
    earringR: row.earringR,
    necklace: row.necklace,
    earringL: row.earringL,
    ringL: row.ringL
  };
  const normalizedAmmoQuantity = row.ammo ? Math.max(1, ammoQuantity) : 0;

  return {
    id,
    playerId: character.playerId,
    slotIndex: character.slotIndex,
    name: character.name,
    gender: character.gender,
    job: character.job,
    progressionRank: character.progressionRank,
    location: character.location,
    level: character.level,
    exp: character.exp,
    penya: character.penya,
    stats: { str, sta, dex, int },
    skillLevels: parseSkillLevels(skillLevels),
    consumableLoadout: parseConsumableLoadout(consumableLoadout),
    equipment,
    equipmentSets: parseEquipmentSets(equipmentSets, equipment),
    ammoQuantity: normalizedAmmoQuantity,
    ammoQuantities: parseAmmoQuantities(ammoQuantities, normalizedAmmoQuantity),
    activeQuestIds,
    completedQuestIds,
    inventory: {
      size: inventorySize,
      items: inventoryItems.map(({ characterId: _characterId, id: _id, ...item }) => item)
    }
  };
}
