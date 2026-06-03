import { randomUUID } from "node:crypto";
import { db } from "./database.js";
import type { Character } from "../types.js";

type CreateCharacterInput = {
  playerId: string;
  slotIndex: number;
  name: string;
};

type CharacterRow = {
  id: string;
  playerId: string;
  slotIndex: number;
  name: string;
  job: string;
  level: number;
  exp: number;
  penya: number;
  inventorySize: number;
  str: number;
  sta: number;
  dex: number;
  int: number;
  helmet: string | null;
  suit: string | null;
  gloves: string | null;
  boots: string | null;
  flying: string | null;
  csBoots: string | null;
  csGloves: string | null;
  csSuit: string | null;
  csHelm: string | null;
  mask: string | null;
  cloak: string | null;
  ammo: string | null;
  offhand: string | null;
  mainhand: string | null;
  ringR: string | null;
  earringR: string | null;
  necklace: string | null;
  earringL: string | null;
  ringL: string | null;
};

type InventoryItemRow = {
  characterId: string;
  slotIndex: number;
  itemId: string;
  quantity: number;
};

export const characterRepository = {
  create({ playerId, slotIndex, name }: CreateCharacterInput) {
    const now = new Date().toISOString();
    const id = randomUUID();

    db.prepare(
      `INSERT INTO characters (
        id,
        player_id,
        slot_index,
        name,
        job,
        level,
        exp,
        penya,
        inventory_size,
        str,
        sta,
        dex,
        int,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(id, playerId, slotIndex, name, "Vagrant", 1, 0, 0, 50, 15, 15, 15, 15, now, now);

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
          job,
          level,
          exp,
          penya,
          inventory_size AS inventorySize,
          str,
          sta,
          dex,
          int,
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
          job,
          level,
          exp,
          penya,
          inventory_size AS inventorySize,
          str,
          sta,
          dex,
          int,
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
      }): Character => ({
        id,
        ...character,
        stats: {
          str,
          sta,
          dex,
          int
        },
        equipment: {
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
        },
        inventory: {
          size: inventorySize,
          items: (inventoryItemsByCharacterId.get(id) ?? []).map(
            ({ characterId: _characterId, ...item }) => item
          )
        }
      })
    );
  }
};
