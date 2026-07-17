import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../auth/auth.middleware.js";
import { characterRepository } from "../data/characterRepository.js";
import type { AuthTokenPayload } from "../types.js";
import { toPublicCharacter } from "./characterRoute.shared.js";

export const characterCoreRouter = Router();

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
const deleteCharacterSchema = z.object({ name: z.string().trim().min(1) });

characterCoreRouter.get("/", requireAuth, async (_request, response) => {
  const auth = response.locals.auth as AuthTokenPayload;
  const characters = (await characterRepository.listByPlayerId(auth.sub)).map(toPublicCharacter);
  response.json({ characters });
});

characterCoreRouter.post("/", requireAuth, async (request, response) => {
  const result = createCharacterSchema.safeParse(request.body);
  if (!result.success) {
    response.status(400).json({ error: "Character name and slot are required" });
    return;
  }

  try {
    const character = await characterRepository.create({
      playerId: (response.locals.auth as AuthTokenPayload).sub,
      ...result.data
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

characterCoreRouter.delete("/:characterId", requireAuth, async (request, response) => {
  const confirmation = deleteCharacterSchema.safeParse(request.body);
  if (!confirmation.success) {
    response.status(400).json({ error: "Character name confirmation is required" });
    return;
  }

  const auth = response.locals.auth as AuthTokenPayload;
  const characterId = z.string().safeParse(request.params.characterId);
  if (!characterId.success) {
    response.status(404).json({ error: "Character not found" });
    return;
  }
  const character = await characterRepository.findById(characterId.data);
  if (!character || character.playerId !== auth.sub) {
    response.status(404).json({ error: "Character not found" });
    return;
  }
  if (character.name !== confirmation.data.name) {
    response.status(400).json({ error: "Character name confirmation does not match" });
    return;
  }
  await characterRepository.deleteByIdForPlayer(character.id, auth.sub);
  response.status(204).send();
});
