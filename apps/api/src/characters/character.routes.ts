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
    if (error instanceof Error && error.message.includes("UNIQUE constraint failed")) {
      response.status(409).json({ error: "That character slot is already occupied" });
      return;
    }

    throw error;
  }
});
