import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../auth/auth.middleware.js";
import { characterRepository } from "../data/characterRepository.js";
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

const updateCharacterProgressionSchema = z
  .object({
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
  .refine((progression) => progression.stats || progression.skillLevels, {
    message: "Stats or skill levels are required"
  });

const moveInventoryItemSchema = z.object({
  fromSlotIndex: z.number().int().min(0).max(99),
  toSlotIndex: z.number().int().min(0).max(99)
});

const sortInventorySchema = z.object({
  sortBy: z.enum(["name", "level", "job", "category"])
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
    response.status(400).json({ error: "Stats or skill levels are required" });
    return;
  }

  const character = await characterRepository.updateProgressionForPlayer(
    characterIdResult.data,
    (response.locals.auth as AuthTokenPayload).sub,
    {
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

  if (!characterIdResult.success || !slotIndexResult.success) {
    response.status(404).json({ error: "Inventory item not found" });
    return;
  }

  const auth = response.locals.auth as AuthTokenPayload;
  const result = await characterRepository.equipInventoryItemForPlayer(
    characterIdResult.data,
    auth.sub,
    slotIndexResult.data
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

    if (!characterIdResult.success || !equipmentSlotResult.success) {
      response.status(404).json({ error: "Equipment slot not found" });
      return;
    }

    const auth = response.locals.auth as AuthTokenPayload;
    const result = await characterRepository.unequipItemForPlayer(
      characterIdResult.data,
      auth.sub,
      equipmentSlotResult.data
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
