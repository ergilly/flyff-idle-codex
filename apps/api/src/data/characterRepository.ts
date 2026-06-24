import { randomUUID } from "node:crypto";
import { db } from "./database.js";
import { startingEquipmentByGender, startingInventoryItems, startingMainhand } from "./starterLoadout.js";
import type { Character, CharacterGender } from "../types.js";
import { findDataRecord, type JsonDataRecord } from "../gameData/gameData.service.js";
import { findItemsByIds } from "../items/itemIconRepository.js";
import type { ItemMetadata } from "../data/generated/itemIconIndex.js";

type CreateCharacterInput = {
  playerId: string;
  slotIndex: number;
  name: string;
  gender: CharacterGender;
};

type CharacterRow = {
  id: string;
  playerId: string;
  slotIndex: number;
  name: string;
  gender: CharacterGender;
  job: string;
  progressionRank: Character["progressionRank"];
  level: number;
  exp: number;
  penya: number;
  inventorySize: number;
  str: number;
  sta: number;
  dex: number;
  int: number;
  skillLevels: string;
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
  id: string;
  characterId: string;
  slotIndex: number;
  itemId: string;
  quantity: number;
};

type InventorySortOption = "name" | "level" | "job" | "category";

const equipmentColumnBySlot = {
  helmet: "helmet",
  suit: "suit",
  gloves: "gloves",
  boots: "boots",
  flying: "flying",
  csBoots: "cs_boots",
  csGloves: "cs_gloves",
  csSuit: "cs_suit",
  csHelm: "cs_helm",
  mask: "mask",
  cloak: "cloak",
  ammo: "ammo",
  offhand: "offhand",
  mainhand: "mainhand",
  ringR: "ring_r",
  earringR: "earring_r",
  necklace: "necklace",
  earringL: "earring_l",
  ringL: "ring_l"
} satisfies Record<keyof Character["equipment"], string>;

const secondJobToFirstJob: Record<string, string> = {
  Blade: "Mercenary",
  Knight: "Mercenary",
  Elementor: "Magician",
  Psykeeper: "Magician",
  Billposter: "Assist",
  Ringmaster: "Assist",
  Jester: "Acrobat",
  Ranger: "Acrobat"
};

const thirdJobToSecondJob: Record<string, string> = {
  Slayer: "Blade",
  Templar: "Knight",
  Arcanist: "Elementor",
  Mentalist: "Psykeeper",
  Forcemaster: "Billposter",
  Seraph: "Ringmaster",
  Harlequin: "Jester",
  Crackshooter: "Ranger"
};

type EquipmentSlot = keyof Character["equipment"];

export const characterRepository = {
  create({ playerId, slotIndex, name, gender }: CreateCharacterInput) {
    const now = new Date().toISOString();
    const id = randomUUID();
    const startingEquipment = startingEquipmentByGender[gender];

    db.prepare(
      `INSERT INTO characters (
        id,
        player_id,
        slot_index,
        name,
        gender,
        job,
        progression_rank,
        level,
        exp,
        penya,
        inventory_size,
        str,
        sta,
        dex,
        int,
        suit,
        gloves,
        boots,
        mainhand,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      playerId,
      slotIndex,
      name,
      gender,
      "Vagrant",
      "normal",
      1,
      0,
      0,
      50,
      15,
      15,
      15,
      15,
      startingEquipment.suit,
      startingEquipment.gloves,
      startingEquipment.boots,
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
  setInventoryItemForPlayer(
    id: string,
    playerId: string,
    inventoryItem: { itemId: string; quantity: number; slotIndex?: number }
  ) {
    const character = this.findById(id);

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

      return this.findById(id);
    }

    const added = addInventoryQuantity(id, character, inventoryItem.itemId, inventoryItem.quantity, now);

    if (!added) {
      return null;
    }

    return this.findById(id);
  },
  moveInventoryItemForPlayer(id: string, playerId: string, fromSlotIndex: number, toSlotIndex: number) {
    const character = this.findById(id);

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
      return { character: this.findById(id), error: null };
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

        return { character: this.findById(id), error: null };
      }
    }

    swapInventorySlots(id, fromSlotIndex, toSlotIndex, now);
    return { character: this.findById(id), error: null };
  },
  sortInventoryForPlayer(id: string, playerId: string, sortBy: InventorySortOption) {
    const character = this.findById(id);

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

    return this.findById(id);
  },
  equipInventoryItemForPlayer(id: string, playerId: string, slotIndex: number) {
    const character = this.findById(id);

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

    const equipmentSlot = getEquipmentSlotForItem(character, item);

    if (!equipmentSlot) {
      return { character: null, error: "That item cannot be equipped" };
    }

    if (equipmentSlot === "offhand" && character.equipment.mainhand) {
      const [mainhandItem] = findItemsByIds([character.equipment.mainhand]);

      if (mainhandItem?.twoHanded) {
        return { character: null, error: "Unequip your two-handed weapon first" };
      }
    }

    const now = new Date().toISOString();
    const returnedItemIds = [
      character.equipment[equipmentSlot],
      equipmentSlot === "mainhand" && item.twoHanded ? character.equipment.offhand : null
    ].filter((itemId): itemId is string => Boolean(itemId));
    const inventorySlotsToUse = [slotIndex, ...getOpenInventorySlots(character, [slotIndex])];

    if (inventorySlotsToUse.length < returnedItemIds.length) {
      return { character: null, error: "Not enough open inventory slots" };
    }

    db.prepare("DELETE FROM character_inventory_items WHERE character_id = ? AND slot_index = ?").run(
      id,
      slotIndex
    );
    db.prepare(
      `UPDATE characters SET ${equipmentColumnBySlot[equipmentSlot]} = ?, updated_at = ? WHERE id = ?`
    ).run(inventoryItem.itemId, now, id);

    if (equipmentSlot === "mainhand" && item.twoHanded) {
      db.prepare("UPDATE characters SET offhand = NULL, updated_at = ? WHERE id = ?").run(now, id);
    }

    insertInventoryItems(id, returnedItemIds, inventorySlotsToUse, now);

    return { character: this.findById(id), error: null };
  },
  unequipItemForPlayer(id: string, playerId: string, equipmentSlot: EquipmentSlot) {
    const character = this.findById(id);

    if (!character || character.playerId !== playerId) {
      return { character: null, error: "Character not found" };
    }

    const itemId = character.equipment[equipmentSlot];

    if (!itemId) {
      return { character: null, error: "Equipment slot is empty" };
    }

    const [slotIndex] = getOpenInventorySlots(character);

    if (slotIndex === undefined) {
      return { character: null, error: "Inventory is full" };
    }

    const now = new Date().toISOString();

    db.prepare(
      `UPDATE characters SET ${equipmentColumnBySlot[equipmentSlot]} = NULL, updated_at = ? WHERE id = ?`
    ).run(now, id);
    insertInventoryItems(id, [itemId], [slotIndex], now);

    return { character: this.findById(id), error: null };
  },
  updateProgressionForPlayer(
    id: string,
    playerId: string,
    progression: { skillLevels?: Character["skillLevels"]; stats?: Character["stats"] }
  ) {
    const character = this.findById(id);

    if (!character || character.playerId !== playerId) {
      return null;
    }

    const nextStats = progression.stats ?? character.stats;
    const nextSkillLevels = progression.skillLevels ?? character.skillLevels;
    const now = new Date().toISOString();

    db.prepare(
      `UPDATE characters
        SET str = ?,
            sta = ?,
            dex = ?,
            int = ?,
            skill_levels = ?,
            updated_at = ?
        WHERE id = ? AND player_id = ?`
    ).run(
      nextStats.str,
      nextStats.sta,
      nextStats.dex,
      nextStats.int,
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
          level,
          exp,
          penya,
          inventory_size AS inventorySize,
          str,
          sta,
          dex,
          int,
          skill_levels AS skillLevels,
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
          level,
          exp,
          penya,
          inventory_size AS inventorySize,
          str,
          sta,
          dex,
          int,
          skill_levels AS skillLevels,
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
        skillLevels: parseSkillLevels(skillLevels),
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
            ({ characterId: _characterId, id: _id, ...item }) => item
          )
        }
      })
    );
  }
};

function parseSkillLevels(skillLevels: string) {
  try {
    const parsed = JSON.parse(skillLevels) as unknown;

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }

    return Object.fromEntries(
      Object.entries(parsed).filter(
        ([skillId, level]) => typeof skillId === "string" && Number.isInteger(level) && level > 0
      )
    ) as Character["skillLevels"];
  } catch {
    return {};
  }
}

function normalizeRequirement(value: string) {
  return value.toLowerCase().replace(/\s+/g, "");
}

function getJobLineage(job: string) {
  const secondJob = thirdJobToSecondJob[job];
  const firstJob = secondJob ? secondJobToFirstJob[secondJob] : secondJobToFirstJob[job];

  return [job, secondJob, firstJob, "Vagrant"].filter((value): value is string => Boolean(value));
}

function canEquipRequiredJob(character: Character, requiredJob: string | null) {
  if (!requiredJob) {
    return true;
  }

  const normalizedRequirement = normalizeRequirement(requiredJob);

  return getJobLineage(character.job).some((job) => normalizeRequirement(job) === normalizedRequirement);
}

function getEquipmentRequirementError(character: Character, item: ItemMetadata) {
  const missingRequirements: string[] = [];

  if (item.level !== null && character.level < item.level) {
    missingRequirements.push(`Level: ${item.level}`);
  }

  if (item.sex && item.sex !== character.gender) {
    missingRequirements.push(`Gender: ${item.sex}`);
  }

  if (!canEquipRequiredJob(character, item.requiredJob)) {
    missingRequirements.push(`Job: ${item.requiredJob}`);
  }

  return missingRequirements.length > 0 ? `Missing requirements:\n${missingRequirements.join("\n")}` : null;
}

function getOpenInventorySlots(character: Character, additionalOpenSlots: number[] = []) {
  const usedSlotIndexes = new Set(character.inventory.items.map((item) => item.slotIndex));

  for (const slotIndex of additionalOpenSlots) {
    usedSlotIndexes.delete(slotIndex);
  }

  return Array.from({ length: character.inventory.size }, (_slot, index) => index).filter(
    (index) => !usedSlotIndexes.has(index)
  );
}

function getItemData(itemId: string) {
  return findDataRecord("items", itemId);
}

function getStringField(item: JsonDataRecord | undefined, field: string) {
  const value = item?.[field];

  return typeof value === "string" ? value : "";
}

function getNumberField(item: JsonDataRecord | undefined, field: string) {
  const value = item?.[field];

  return typeof value === "number" ? value : null;
}

function getMaxStackSize(itemId: string) {
  const stack = getNumberField(getItemData(itemId), "stack");

  return stack && stack > 0 ? stack : 1;
}

function updateInventorySize(characterId: string, slotIndex: number, now: string) {
  db.prepare(
    "UPDATE characters SET inventory_size = MAX(inventory_size, ?), updated_at = ? WHERE id = ?"
  ).run(slotIndex + 1, now, characterId);
}

function setInventorySlot(
  character: Character,
  playerId: string,
  inventoryItem: { itemId: string; quantity: number; slotIndex: number },
  now: string
) {
  if (inventoryItem.slotIndex >= character.inventory.size || character.playerId !== playerId) {
    return false;
  }

  const existingItem = db
    .prepare("SELECT id FROM character_inventory_items WHERE character_id = ? AND slot_index = ?")
    .get(character.id, inventoryItem.slotIndex) as { id: string } | undefined;

  if (existingItem) {
    db.prepare(
      "UPDATE character_inventory_items SET item_id = ?, quantity = ?, updated_at = ? WHERE id = ?"
    ).run(inventoryItem.itemId, inventoryItem.quantity, now, existingItem.id);
    return true;
  }

  db.prepare(
    "INSERT INTO character_inventory_items (id, character_id, slot_index, item_id, quantity, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
  ).run(
    randomUUID(),
    character.id,
    inventoryItem.slotIndex,
    inventoryItem.itemId,
    inventoryItem.quantity,
    now,
    now
  );

  return true;
}

function addInventoryQuantity(
  characterId: string,
  character: Character,
  itemId: string,
  quantity: number,
  now: string
) {
  let remainingQuantity = quantity;
  const maxStackSize = getMaxStackSize(itemId);
  const matchingStacks = character.inventory.items
    .filter((item) => item.itemId === itemId && item.quantity < maxStackSize)
    .sort((first, second) => first.slotIndex - second.slotIndex);
  const openSlots = getOpenInventorySlots(character);
  const availableStackQuantity = matchingStacks.reduce(
    (total, stack) => total + maxStackSize - stack.quantity,
    0
  );

  if (availableStackQuantity + openSlots.length * maxStackSize < quantity) {
    return false;
  }

  for (const stack of matchingStacks) {
    const addedQuantity = Math.min(maxStackSize - stack.quantity, remainingQuantity);

    db.prepare(
      "UPDATE character_inventory_items SET quantity = ?, updated_at = ? WHERE character_id = ? AND slot_index = ?"
    ).run(stack.quantity + addedQuantity, now, characterId, stack.slotIndex);
    remainingQuantity -= addedQuantity;

    if (remainingQuantity === 0) {
      return true;
    }
  }

  const requiredOpenSlots = Math.ceil(remainingQuantity / maxStackSize);

  if (openSlots.length < requiredOpenSlots) {
    return false;
  }

  const insertInventoryItem = db.prepare(
    "INSERT INTO character_inventory_items (id, character_id, slot_index, item_id, quantity, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
  );

  for (const slotIndex of openSlots.slice(0, requiredOpenSlots)) {
    const stackQuantity = Math.min(maxStackSize, remainingQuantity);

    insertInventoryItem.run(randomUUID(), characterId, slotIndex, itemId, stackQuantity, now, now);
    updateInventorySize(characterId, slotIndex, now);
    remainingQuantity -= stackQuantity;
  }

  return remainingQuantity === 0;
}

function swapInventorySlots(characterId: string, fromSlotIndex: number, toSlotIndex: number, now: string) {
  const temporarySlotIndex = -1;

  db.prepare(
    "UPDATE character_inventory_items SET slot_index = ?, updated_at = ? WHERE character_id = ? AND slot_index = ?"
  ).run(temporarySlotIndex, now, characterId, fromSlotIndex);
  db.prepare(
    "UPDATE character_inventory_items SET slot_index = ?, updated_at = ? WHERE character_id = ? AND slot_index = ?"
  ).run(fromSlotIndex, now, characterId, toSlotIndex);
  db.prepare(
    "UPDATE character_inventory_items SET slot_index = ?, updated_at = ? WHERE character_id = ? AND slot_index = ?"
  ).run(toSlotIndex, now, characterId, temporarySlotIndex);
}

function reassignInventorySlots(
  characterId: string,
  slotMoves: Array<{ fromSlotIndex: number; toSlotIndex: number }>,
  now: string
) {
  const offset = 1000;
  const updateSlot = db.prepare(
    "UPDATE character_inventory_items SET slot_index = ?, updated_at = ? WHERE character_id = ? AND slot_index = ?"
  );

  for (const { fromSlotIndex } of slotMoves) {
    updateSlot.run(fromSlotIndex + offset, now, characterId, fromSlotIndex);
  }

  for (const { fromSlotIndex, toSlotIndex } of slotMoves) {
    updateSlot.run(toSlotIndex, now, characterId, fromSlotIndex + offset);
  }

  if (slotMoves.length > 0) {
    updateInventorySize(characterId, Math.max(...slotMoves.map((move) => move.toSlotIndex)), now);
  }
}

function compareText(first: string, second: string) {
  return first.localeCompare(second, undefined, { sensitivity: "base", numeric: true });
}

function compareInventoryItems(
  first: Character["inventory"]["items"][number],
  second: Character["inventory"]["items"][number],
  sortBy: InventorySortOption
) {
  const firstItem = getItemData(first.itemId);
  const secondItem = getItemData(second.itemId);
  const fallback = first.slotIndex - second.slotIndex;

  if (sortBy === "level") {
    return (
      (getNumberField(firstItem, "level") ?? Number.MAX_SAFE_INTEGER) -
        (getNumberField(secondItem, "level") ?? Number.MAX_SAFE_INTEGER) ||
      compareText(getStringField(firstItem, "name"), getStringField(secondItem, "name")) ||
      fallback
    );
  }

  if (sortBy === "job") {
    return (
      compareText(getStringField(firstItem, "requiredJob"), getStringField(secondItem, "requiredJob")) ||
      compareText(getStringField(firstItem, "name"), getStringField(secondItem, "name")) ||
      fallback
    );
  }

  if (sortBy === "category") {
    return (
      compareText(getStringField(firstItem, "category"), getStringField(secondItem, "category")) ||
      compareText(getStringField(firstItem, "subcategory"), getStringField(secondItem, "subcategory")) ||
      compareText(getStringField(firstItem, "name"), getStringField(secondItem, "name")) ||
      fallback
    );
  }

  return compareText(getStringField(firstItem, "name"), getStringField(secondItem, "name")) || fallback;
}

function getFirstOpenPairSlot(
  character: Character,
  leftSlot: "earringL" | "ringL",
  rightSlot: "earringR" | "ringR"
) {
  return character.equipment[leftSlot] ? rightSlot : leftSlot;
}

function getEquipmentSlotForItem(character: Character, item: ItemMetadata): EquipmentSlot | null {
  if (item.category === "weapon") {
    return "mainhand";
  }

  if (item.category === "flying") {
    return "flying";
  }

  if (item.category === "arrow") {
    return "ammo";
  }

  if (item.category === "jewelry") {
    if (item.subcategory === "necklace") {
      return "necklace";
    }

    if (item.subcategory === "earring") {
      return getFirstOpenPairSlot(character, "earringL", "earringR");
    }

    if (item.subcategory === "ring") {
      return getFirstOpenPairSlot(character, "ringL", "ringR");
    }
  }

  if (item.category === "armor") {
    if (item.subcategory === "helmet") {
      return "helmet";
    }

    if (item.subcategory === "suit") {
      return "suit";
    }

    if (item.subcategory === "gauntlet" || item.subcategory === "gloves") {
      return "gloves";
    }

    if (item.subcategory === "boots") {
      return "boots";
    }

    if (item.subcategory === "shield") {
      return "offhand";
    }
  }

  if (item.category === "fashion") {
    if (item.subcategory === "hat") {
      return "csHelm";
    }

    if (item.subcategory === "cloth") {
      return "csSuit";
    }

    if (item.subcategory === "glove") {
      return "csGloves";
    }

    if (item.subcategory === "shoes") {
      return "csBoots";
    }

    if (item.subcategory === "mask") {
      return "mask";
    }

    if (item.subcategory === "cloak" || item.subcategory === "visualcloak") {
      return "cloak";
    }
  }

  return null;
}

function insertInventoryItems(characterId: string, itemIds: string[], slotIndexes: number[], now: string) {
  const maximumSlotIndex = Math.max(...slotIndexes, -1);

  if (maximumSlotIndex >= 0) {
    db.prepare(
      "UPDATE characters SET inventory_size = MAX(inventory_size, ?), updated_at = ? WHERE id = ?"
    ).run(maximumSlotIndex + 1, now, characterId);
  }

  const insertInventoryItem = db.prepare(
    "INSERT INTO character_inventory_items (id, character_id, slot_index, item_id, quantity, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
  );

  itemIds.forEach((itemId, index) => {
    insertInventoryItem.run(randomUUID(), characterId, slotIndexes[index], itemId, 1, now, now);
  });
}
