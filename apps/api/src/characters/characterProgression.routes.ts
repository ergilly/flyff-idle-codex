import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../auth/auth.middleware.js";
import { characterRepository } from "../data/characterRepository.js";
import type { AuthTokenPayload } from "../types.js";
import { toPublicCharacter } from "./characterRoute.shared.js";

export const characterProgressionRouter = Router();

const progressionSchema = z
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
    (value) =>
      value.stats ||
      value.skillLevels ||
      value.penya !== undefined ||
      value.level !== undefined ||
      value.exp !== undefined,
    { message: "Progression update is required" }
  )
  .refine((value) => (value.level === undefined) === (value.exp === undefined), {
    message: "Level and exp must be updated together"
  });

characterProgressionRouter.patch("/:characterId/progression", requireAuth, async (request, response) => {
  const characterId = z.string().safeParse(request.params.characterId);
  if (!characterId.success) {
    response.status(404).json({ error: "Character not found" });
    return;
  }
  const progression = progressionSchema.safeParse(request.body);
  if (!progression.success) {
    response.status(400).json({ error: "Progression update is required" });
    return;
  }
  const character = await characterRepository.updateProgressionForPlayer(
    characterId.data,
    (response.locals.auth as AuthTokenPayload).sub,
    {
      ...progression.data,
      skillLevels: progression.data.skillLevels
        ? Object.fromEntries(Object.entries(progression.data.skillLevels).filter(([, level]) => level > 0))
        : undefined
    }
  );
  if (!character) {
    response.status(404).json({ error: "Character not found" });
    return;
  }
  response.json({ character: toPublicCharacter(character) });
});
