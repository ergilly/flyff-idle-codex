import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../auth/auth.middleware.js";
import { characterRepository } from "../data/characterRepository.js";
import { findItemsByIds } from "../items/itemIconRepository.js";
import type { AuthTokenPayload, Character } from "../types.js";

export const characterRouter = Router();

const createCharacterSchema = z.object({
  slotIndex: z.number().int().min(0).max(7),
  name: z
    .string()
    .trim()
    .min(3)
    .max(16)
    .regex(/^[A-Za-z][A-Za-z0-9 ]*$/),
  gender: z.enum(["male", "female"])
});

const deleteCharacterSchema = z.object({
  name: z.string().trim().min(1)
});

const equipmentSlotSchema = z.enum([
  "helmet",
  "suit",
  "gloves",
  "boots",
  "flying",
  "csBoots",
  "csGloves",
  "csSuit",
  "csHelm",
  "mask",
  "cloak",
  "ammo",
  "offhand",
  "mainhand",
  "ringR",
  "earringR",
  "necklace",
  "earringL",
  "ringL"
]);
const consumableResourceSchema = z.enum(["hp", "mp", "fp"]);

const updateCharacterProgressionSchema = z
  .object({
    exp: z.number().int().min(0).optional(),
    level: z.number().int().min(1).max(170).optional(),
    penya: z.number().int().min(0).optional(),
    stats: z
      .object({
        str: z.number().int().min(15).max(999),
        sta: z.number().int().min(15).max(999),
        dex: z.number().int().min(15).max(999),
        int: z.number().int().min(15).max(999)
      })
      .optional(),
    skillLevels: z.record(z.string().min(1).max(80), z.number().int().min(0).max(20)).optional()
  })
  .refine(
    (progression) =>
      progression.stats ||
      progression.skillLevels ||
      progression.penya !== undefined ||
      progression.level !== undefined ||
      progression.exp !== undefined,
    {
      message: "Progression update is required"
    }
  )
  .refine((progression) => (progression.level === undefined) === (progression.exp === undefined), {
    message: "Level and exp must be updated together"
  });

const moveInventoryItemSchema = z.object({
  fromSlotIndex: z.number().int().min(0).max(99),
  toSlotIndex: z.number().int().min(0).max(99)
});

const lootInventoryItemsSchema = z.object({
  items: z
    .array(
      z.object({
        itemId: z.string().regex(/^\d+$/),
        quantity: z.number().int().min(1).max(9999)
      })
    )
    .min(1)
    .max(50)
});

const sortInventorySchema = z.object({
  sortBy: z.enum(["name", "level", "job", "category"])
});

const equipmentSetRequestSchema = z
  .object({
    equipmentSet: z.number().int().min(0).max(2).optional()
  })
  .optional();
const consumableEquipRequestSchema = z.object({
  slotIndex: z.number().int().min(0).max(99).nullable()
});

function toPublicCharacter({ playerId: _playerId, ...character }: Character) {
  return character;
}

characterRouter.get("/", requireAuth, async (_request, response) => {
  const auth = response.locals.auth as AuthTokenPayload;
  const characters = (await characterRepository.listByPlayerId(auth.sub)).map(toPublicCharacter);

  response.json({ characters });
});

characterRouter.post("/", requireAuth, async (request, response) => {
  const result = createCharacterSchema.safeParse(request.body);

  if (!result.success) {
    response.status(400).json({ error: "Character name and slot are required" });
    return;
  }

  try {
    const character = await characterRepository.create({
      playerId: (response.locals.auth as AuthTokenPayload).sub,
      slotIndex: result.data.slotIndex,
      name: result.data.name,
      gender: result.data.gender
    });

    if (!character) {
      response.status(500).json({ error: "Unable to create character" });
      return;
    }

    response.status(201).json({ character: toPublicCharacter(character) });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (message.includes("UNIQUE constraint failed")) {
      response.status(409).json({ error: "That character slot is already occupied" });
      return;
    }

    throw error;
  }
});

characterRouter.patch("/:characterId/progression", requireAuth, async (request, response) => {
  const characterIdResult = z.string().safeParse(request.params.characterId);

  if (!characterIdResult.success) {
    response.status(404).json({ error: "Character not found" });
    return;
  }

  const result = updateCharacterProgressionSchema.safeParse(request.body);

  if (!result.success) {
    response.status(400).json({ error: "Progression update is required" });
    return;
  }

  const character = await characterRepository.updateProgressionForPlayer(
    characterIdResult.data,
    (response.locals.auth as AuthTokenPayload).sub,
    {
      exp: result.data.exp,
      level: result.data.level,
      penya: result.data.penya,
      stats: result.data.stats,
      skillLevels: result.data.skillLevels
        ? Object.fromEntries(Object.entries(result.data.skillLevels).filter(([, level]) => level > 0))
        : undefined
    }
  );

  if (!character) {
    response.status(404).json({ error: "Character not found" });
    return;
  }

  response.json({ character: toPublicCharacter(character) });
});

characterRouter.post("/:characterId/inventory/:slotIndex/equip", requireAuth, async (request, response) => {
  const characterIdResult = z.string().safeParse(request.params.characterId);
  const slotIndexResult = z.coerce.number().int().min(0).max(99).safeParse(request.params.slotIndex);
  const equipmentSetResult = equipmentSetRequestSchema.safeParse(request.body);

  if (!characterIdResult.success || !slotIndexResult.success || !equipmentSetResult.success) {
    response.status(404).json({ error: "Inventory item not found" });
    return;
  }

  const auth = response.locals.auth as AuthTokenPayload;
  const result = await characterRepository.equipInventoryItemForPlayer(
    characterIdResult.data,
    auth.sub,
    slotIndexResult.data,
    (equipmentSetResult.data?.equipmentSet ?? 0) as 0 | 1 | 2
  );

  if (!result.character) {
    response
      .status(
        result.error === "Character not found" || result.error === "Inventory item not found" ? 404 : 400
      )
      .json({ error: result.error ?? "Unable to equip item" });
    return;
  }

  response.json({ character: toPublicCharacter(result.character) });
});

characterRouter.post("/:characterId/consumables/:resource", requireAuth, async (request, response) => {
  const characterIdResult = z.string().safeParse(request.params.characterId);
  const resourceResult = consumableResourceSchema.safeParse(request.params.resource);
  const requestResult = consumableEquipRequestSchema.safeParse(request.body);

  if (!characterIdResult.success || !resourceResult.success || !requestResult.success) {
    response.status(400).json({ error: "Consumable item is required" });
    return;
  }

  const auth = response.locals.auth as AuthTokenPayload;
  const result = await characterRepository.equipConsumableItemForPlayer(
    characterIdResult.data,
    auth.sub,
    resourceResult.data,
    requestResult.data.slotIndex
  );

  if (!result.character) {
    const statusCode =
      result.error === "Character not found" ||
      result.error === "Inventory item not found" ||
      result.error === "Item not found"
        ? 404
        : 400;

    response.status(statusCode).json({ error: result.error ?? "Unable to equip consumable" });
    return;
  }

  response.json({ character: toPublicCharacter(result.character) });
});

characterRouter.post(
  "/:characterId/consumables/:resource/consume",
  requireAuth,
  async (request, response) => {
    const characterIdResult = z.string().safeParse(request.params.characterId);
    const resourceResult = consumableResourceSchema.safeParse(request.params.resource);

    if (!characterIdResult.success || !resourceResult.success) {
      response.status(404).json({ error: "Consumable slot not found" });
      return;
    }

    const auth = response.locals.auth as AuthTokenPayload;
    const result = await characterRepository.consumeEquippedConsumableForPlayer(
      characterIdResult.data,
      auth.sub,
      resourceResult.data
    );

    if (!result.character) {
      response
        .status(
          result.error === "Character not found" || result.error === "Consumable slot is empty" ? 404 : 400
        )
        .json({ error: result.error ?? "Unable to consume item" });
      return;
    }

    response.json({ character: toPublicCharacter(result.character) });
  }
);

characterRouter.post("/:characterId/inventory/move", requireAuth, async (request, response) => {
  const characterIdResult = z.string().safeParse(request.params.characterId);
  const result = moveInventoryItemSchema.safeParse(request.body);

  if (!characterIdResult.success || !result.success) {
    response.status(400).json({ error: "Source and destination slots are required" });
    return;
  }

  const auth = response.locals.auth as AuthTokenPayload;
  const moveResult = await characterRepository.moveInventoryItemForPlayer(
    characterIdResult.data,
    auth.sub,
    result.data.fromSlotIndex,
    result.data.toSlotIndex
  );

  if (!moveResult.character) {
    response
      .status(
        moveResult.error === "Character not found" || moveResult.error === "Inventory item not found"
          ? 404
          : 400
      )
      .json({ error: moveResult.error ?? "Unable to move item" });
    return;
  }

  response.json({ character: toPublicCharacter(moveResult.character) });
});

characterRouter.post("/:characterId/inventory/:slotIndex/consume", requireAuth, async (request, response) => {
  const characterIdResult = z.string().safeParse(request.params.characterId);
  const slotIndexResult = z.coerce.number().int().min(0).max(99).safeParse(request.params.slotIndex);

  if (!characterIdResult.success || !slotIndexResult.success) {
    response.status(404).json({ error: "Inventory item not found" });
    return;
  }

  const auth = response.locals.auth as AuthTokenPayload;
  const consumeResult = await characterRepository.consumeInventoryItemForPlayer(
    characterIdResult.data,
    auth.sub,
    slotIndexResult.data
  );

  if (!consumeResult.character) {
    response
      .status(
        consumeResult.error === "Character not found" || consumeResult.error === "Inventory item not found"
          ? 404
          : 400
      )
      .json({ error: consumeResult.error ?? "Unable to consume item" });
    return;
  }

  response.json({ character: toPublicCharacter(consumeResult.character) });
});

characterRouter.post("/:characterId/inventory/loot", requireAuth, async (request, response) => {
  const characterIdResult = z.string().safeParse(request.params.characterId);
  const result = lootInventoryItemsSchema.safeParse(request.body);

  if (!characterIdResult.success || !result.success) {
    response.status(400).json({ error: "Loot items are required" });
    return;
  }

  const itemIds = Array.from(new Set(result.data.items.map((item) => item.itemId)));
  const foundItemIds = new Set(findItemsByIds(itemIds).map((item) => item.id));

  if (itemIds.some((itemId) => !foundItemIds.has(itemId))) {
    response.status(404).json({ error: "Item not found" });
    return;
  }

  const auth = response.locals.auth as AuthTokenPayload;
  const lootResult = await characterRepository.addInventoryItemsForPlayer(
    characterIdResult.data,
    auth.sub,
    result.data.items
  );

  if (!lootResult.character) {
    const existingCharacter = characterRepository.findById(characterIdResult.data);
    const isOwnedCharacter = existingCharacter?.playerId === auth.sub;

    response.status(isOwnedCharacter ? 400 : 404).json({
      error: isOwnedCharacter ? (lootResult.error ?? "Not enough inventory space") : "Character not found"
    });
    return;
  }

  response.json({ character: toPublicCharacter(lootResult.character) });
});

characterRouter.post("/:characterId/inventory/sort", requireAuth, async (request, response) => {
  const characterIdResult = z.string().safeParse(request.params.characterId);
  const result = sortInventorySchema.safeParse(request.body);

  if (!characterIdResult.success || !result.success) {
    response.status(400).json({ error: "Sort option is required" });
    return;
  }

  const auth = response.locals.auth as AuthTokenPayload;
  const character = await characterRepository.sortInventoryForPlayer(
    characterIdResult.data,
    auth.sub,
    result.data.sortBy
  );

  if (!character) {
    response.status(404).json({ error: "Character not found" });
    return;
  }

  response.json({ character: toPublicCharacter(character) });
});

characterRouter.post(
  "/:characterId/equipment/:equipmentSlot/unequip",
  requireAuth,
  async (request, response) => {
    const characterIdResult = z.string().safeParse(request.params.characterId);
    const equipmentSlotResult = equipmentSlotSchema.safeParse(request.params.equipmentSlot);
    const equipmentSetResult = equipmentSetRequestSchema.safeParse(request.body);

    if (!characterIdResult.success || !equipmentSlotResult.success || !equipmentSetResult.success) {
      response.status(404).json({ error: "Equipment slot not found" });
      return;
    }

    const auth = response.locals.auth as AuthTokenPayload;
    const result = await characterRepository.unequipItemForPlayer(
      characterIdResult.data,
      auth.sub,
      equipmentSlotResult.data,
      (equipmentSetResult.data?.equipmentSet ?? 0) as 0 | 1 | 2
    );

    if (!result.character) {
      response
        .status(
          result.error === "Character not found" || result.error === "Equipment slot is empty" ? 404 : 400
        )
        .json({ error: result.error ?? "Unable to unequip item" });
      return;
    }

    response.json({ character: toPublicCharacter(result.character) });
  }
);

characterRouter.delete("/:characterId", requireAuth, async (request, response) => {
  const result = deleteCharacterSchema.safeParse(request.body);

  if (!result.success) {
    response.status(400).json({ error: "Character name confirmation is required" });
    return;
  }

  const auth = response.locals.auth as AuthTokenPayload;
  const characterIdResult = z.string().safeParse(request.params.characterId);

  if (!characterIdResult.success) {
    response.status(404).json({ error: "Character not found" });
    return;
  }

  const character = await characterRepository.findById(characterIdResult.data);

  if (!character || character.playerId !== auth.sub) {
    response.status(404).json({ error: "Character not found" });
    return;
  }

  if (character.name !== result.data.name) {
    response.status(400).json({ error: "Character name confirmation does not match" });
    return;
  }

  await characterRepository.deleteByIdForPlayer(character.id, auth.sub);
  response.status(204).send();
});
