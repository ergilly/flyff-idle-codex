import { Router } from "express";
import { z } from "zod";
import { requireAdmin } from "../auth/auth.middleware.js";
import { characterRepository } from "../data/characterRepository.js";
import { findItemsByIds } from "../items/itemIconRepository.js";
import type { AuthTokenPayload, Character } from "../types.js";

export const adminRouter = Router();

function toPublicCharacter({ playerId: _playerId, ...character }: Character) {
  return character;
}

const addInventoryItemSchema = z.object({
  itemId: z.string().regex(/^\d+$/),
  quantity: z.number().int().min(1).max(9999)
});

adminRouter.post("/characters/:characterId/refund-stats", requireAdmin, async (request, response) => {
  const characterIdResult = z.string().safeParse(request.params.characterId);

  if (!characterIdResult.success) {
    response.status(404).json({ error: "Character not found" });
    return;
  }

  const auth = response.locals.auth as AuthTokenPayload;
  const character = await characterRepository.refundStatsForPlayer(characterIdResult.data, auth.sub);

  if (!character) {
    response.status(404).json({ error: "Character not found" });
    return;
  }

  response.json({ character: toPublicCharacter(character) });
});

adminRouter.post("/characters/:characterId/inventory", requireAdmin, async (request, response) => {
  const characterIdResult = z.string().safeParse(request.params.characterId);

  if (!characterIdResult.success) {
    response.status(404).json({ error: "Character not found" });
    return;
  }

  const result = addInventoryItemSchema.safeParse(request.body);

  if (!result.success) {
    response.status(400).json({ error: "Item and quantity are required" });
    return;
  }

  const [item] = findItemsByIds([result.data.itemId]);

  if (!item) {
    response.status(404).json({ error: "Item not found" });
    return;
  }

  const auth = response.locals.auth as AuthTokenPayload;
  const character = await characterRepository.setInventoryItemForPlayer(characterIdResult.data, auth.sub, {
    itemId: result.data.itemId,
    quantity: result.data.quantity
  });

  if (!character) {
    const existingCharacter = characterRepository.findById(characterIdResult.data);
    const isOwnedCharacter = existingCharacter?.playerId === auth.sub;

    response
      .status(isOwnedCharacter ? 400 : 404)
      .json({ error: isOwnedCharacter ? "Not enough inventory space" : "Character not found" });
    return;
  }

  response.json({ character: toPublicCharacter(character) });
});

adminRouter.post("/characters/:characterId/refund-skills", requireAdmin, async (request, response) => {
  const characterIdResult = z.string().safeParse(request.params.characterId);

  if (!characterIdResult.success) {
    response.status(404).json({ error: "Character not found" });
    return;
  }

  const auth = response.locals.auth as AuthTokenPayload;
  const character = await characterRepository.refundSkillsForPlayer(characterIdResult.data, auth.sub);

  if (!character) {
    response.status(404).json({ error: "Character not found" });
    return;
  }

  response.json({ character: toPublicCharacter(character) });
});
