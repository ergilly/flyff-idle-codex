import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../auth/auth.middleware.js";
import { characterRepository } from "../data/characterRepository.js";
import type { AuthTokenPayload, Character } from "../types.js";
import { travelDestinationIds } from "./travelRules.js";

export const travelRouter = Router();

const travelRequestSchema = z.object({
  destination: z.enum(travelDestinationIds),
  method: z.enum(["flying", "blinkwing"]),
  equipmentSet: z.number().int().min(0).max(2).default(0)
});

function toPublicCharacter({ playerId: _playerId, ...character }: Character) {
  return character;
}

travelRouter.post("/:characterId/travel", requireAuth, (request, response) => {
  const characterIdResult = z.string().safeParse(request.params.characterId);
  const travelResult = travelRequestSchema.safeParse(request.body);

  if (!characterIdResult.success || !travelResult.success) {
    response.status(400).json({ error: "A valid travel destination and method are required" });
    return;
  }

  const result = characterRepository.travelForPlayer(
    characterIdResult.data,
    (response.locals.auth as AuthTokenPayload).sub,
    travelResult.data.destination,
    travelResult.data.method,
    travelResult.data.equipmentSet as 0 | 1 | 2
  );

  if (!result.character) {
    response
      .status(result.error === "Character not found" ? 404 : 403)
      .json({ error: result.error ?? "Unable to travel" });
    return;
  }

  response.json({ character: toPublicCharacter(result.character) });
});
