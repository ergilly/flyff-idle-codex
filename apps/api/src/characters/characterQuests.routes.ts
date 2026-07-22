import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../auth/auth.middleware.js";
import { sendApiError } from "../http/apiError.js";
import type { AuthTokenPayload } from "../types.js";
import { sendCharacter } from "./characterRoute.shared.js";
import {
  abandonCharacterQuest,
  acceptCharacterQuest,
  completeCharacterQuest
} from "./characterQuests.service.js";

export const characterQuestsRouter = Router();

const acceptQuestSchema = z.object({
  questId: z.number().int().positive(),
  npcId: z.number().int().positive()
});

characterQuestsRouter.post("/:characterId/quests", requireAuth, (request, response) => {
  const input = acceptQuestSchema.safeParse(request.body);

  if (!input.success) {
    sendApiError(response, 400, "invalid_request", "Quest and NPC ids are required");
    return;
  }

  const auth = response.locals.auth as AuthTokenPayload;

  try {
    const result = acceptCharacterQuest(
      String(request.params.characterId),
      auth.sub,
      input.data.questId,
      input.data.npcId
    );

    if (result.status === "accepted") {
      sendCharacter(response, result.character, 201);
    } else if (result.status === "not_found") {
      sendApiError(response, 404, "not_found", result.error);
    } else if (result.status === "conflict") {
      sendApiError(response, 409, "conflict", result.error);
    } else {
      sendApiError(response, 422, "domain_rule_failed", result.error);
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes("UNIQUE constraint failed")) {
      sendApiError(response, 409, "conflict", "Quest is already active");
      return;
    }
    throw error;
  }
});

const abandonQuestPathSchema = z.object({
  characterId: z.string().min(1),
  questId: z.coerce.number().int().positive()
});

characterQuestsRouter.delete("/:characterId/quests/:questId", requireAuth, (request, response) => {
  const input = abandonQuestPathSchema.safeParse(request.params);

  if (!input.success) {
    sendApiError(response, 400, "invalid_request", "A valid quest id is required");
    return;
  }

  const auth = response.locals.auth as AuthTokenPayload;
  const result = abandonCharacterQuest(input.data.characterId, auth.sub, input.data.questId);

  if (result.status === "abandoned") {
    sendCharacter(response, result.character);
  } else {
    sendApiError(response, 404, "not_found", result.error);
  }
});

const completeQuestSchema = z.object({ npcId: z.number().int().positive() });

characterQuestsRouter.post("/:characterId/quests/:questId/complete", requireAuth, (request, response) => {
  const path = abandonQuestPathSchema.safeParse(request.params);
  const body = completeQuestSchema.safeParse(request.body);

  if (!path.success || !body.success) {
    sendApiError(response, 400, "invalid_request", "Valid quest and NPC ids are required");
    return;
  }

  const auth = response.locals.auth as AuthTokenPayload;
  const result = completeCharacterQuest(path.data.characterId, auth.sub, path.data.questId, body.data.npcId);

  if (result.status === "completed") {
    sendCharacter(response, result.character);
  } else if (result.status === "not_found") {
    sendApiError(response, 404, "not_found", result.error);
  } else {
    sendApiError(response, 422, "domain_rule_failed", result.error);
  }
});
