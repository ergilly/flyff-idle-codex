import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../auth/auth.middleware.js";
import { characterRepository } from "../data/characterRepository.js";
import { sendApiError } from "../http/apiError.js";
import { sendCharacter } from "../http/characterResponse.js";
import type { AuthTokenPayload } from "../types.js";
import { allocateSkills, allocateStats } from "./characterProgression.service.js";

export const characterProgressionRouter = Router();

const characterIdSchema = z.string().min(1);
const statAllocationsSchema = z
  .object({
    allocations: z.object({
      str: z.number().int().min(0).max(984),
      sta: z.number().int().min(0).max(984),
      dex: z.number().int().min(0).max(984),
      int: z.number().int().min(0).max(984)
    })
  })
  .refine(({ allocations }) => Object.values(allocations).some((points) => points > 0));
const skillAllocationsSchema = z.object({
  allocations: z
    .record(z.string().regex(/^\d+$/), z.number().int().min(1).max(20))
    .refine((value) => Object.keys(value).length > 0)
});
const battleStateSchema = z.object({
  exp: z.number().int().min(0),
  level: z.number().int().min(1).max(170),
  penya: z.number().int().min(0)
});

characterProgressionRouter.post(
  "/:characterId/progression/stat-allocations",
  requireAuth,
  (request, response) => {
    const characterId = characterIdSchema.safeParse(request.params.characterId);
    const input = statAllocationsSchema.safeParse(request.body);
    if (!characterId.success || !input.success) {
      sendApiError(response, 400, "invalid_request", "At least one positive stat allocation is required");
      return;
    }

    const result = allocateStats(
      characterId.data,
      (response.locals.auth as AuthTokenPayload).sub,
      input.data.allocations
    );
    if (!result.character) {
      const status = result.error === "Character not found" ? 404 : 422;
      sendApiError(
        response,
        status,
        status === 404 ? "not_found" : "domain_rule_failed",
        result.error ?? "Unable to allocate stat points"
      );
      return;
    }

    sendCharacter(response, result.character);
  }
);

characterProgressionRouter.post(
  "/:characterId/progression/skill-allocations",
  requireAuth,
  (request, response) => {
    const characterId = characterIdSchema.safeParse(request.params.characterId);
    const input = skillAllocationsSchema.safeParse(request.body);
    if (!characterId.success || !input.success) {
      sendApiError(response, 400, "invalid_request", "At least one positive skill allocation is required");
      return;
    }

    const result = allocateSkills(
      characterId.data,
      (response.locals.auth as AuthTokenPayload).sub,
      input.data.allocations
    );
    if (!result.character) {
      const status = result.error === "Character not found" ? 404 : 422;
      sendApiError(
        response,
        status,
        status === 404 ? "not_found" : "domain_rule_failed",
        result.error ?? "Unable to allocate skill points"
      );
      return;
    }

    sendCharacter(response, result.character);
  }
);

characterProgressionRouter.put("/:characterId/progression/battle-state", requireAuth, (request, response) => {
  const characterId = characterIdSchema.safeParse(request.params.characterId);
  const battleState = battleStateSchema.safeParse(request.body);
  if (!characterId.success || !battleState.success) {
    sendApiError(response, 400, "invalid_request", "A complete battle progression state is required");
    return;
  }

  const character = characterRepository.updateProgressionForPlayer(
    characterId.data,
    (response.locals.auth as AuthTokenPayload).sub,
    battleState.data
  );
  if (!character) {
    sendApiError(response, 404, "not_found", "Character not found");
    return;
  }

  sendCharacter(response, character);
});
