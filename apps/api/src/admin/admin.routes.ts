import { Router } from "express";
import { z } from "zod";
import { requireAdmin } from "../auth/auth.middleware.js";
import { characterRepository } from "../data/characterRepository.js";
import { findItemsByIds } from "../items/itemIconRepository.js";
import type { AuthTokenPayload } from "../types.js";
import { toPublicCharacter } from "../http/characterResponse.js";

export const adminRouter = Router();

const addInventoryItemSchema = z.object({
  itemId: z.string().regex(/^\d+$/),
  quantity: z.number().int().min(1).max(9999)
});
const addPenyaSchema = z.object({
  amount: z.number().int().min(1).max(2_147_483_647)
});

adminRouter.post("/characters/:characterId/penya", requireAdmin, (request, response) => {
  const characterIdResult = z.string().safeParse(request.params.characterId);
  const amountResult = addPenyaSchema.safeParse(request.body);

  if (!characterIdResult.success || !amountResult.success) {
    response.status(400).json({ error: "A positive Penya amount is required" });
    return;
  }

  const auth = response.locals.auth as AuthTokenPayload;
  const character = characterRepository.addPenyaForPlayer(
    characterIdResult.data,
    auth.sub,
    amountResult.data.amount
  );

  if (!character) {
    response.status(404).json({ error: "Character not found" });
    return;
  }

  response.json({ character: toPublicCharacter(character) });
});

adminRouter.post("/characters/:characterId/refund-stats", requireAdmin, (request, response) => {
  const characterIdResult = z.string().safeParse(request.params.characterId);

  if (!characterIdResult.success) {
    response.status(404).json({ error: "Character not found" });
    return;
  }

  const auth = response.locals.auth as AuthTokenPayload;
  const character = characterRepository.refundStatsForPlayer(characterIdResult.data, auth.sub);

  if (!character) {
    response.status(404).json({ error: "Character not found" });
    return;
  }

  response.json({ character: toPublicCharacter(character) });
});

adminRouter.post("/characters/:characterId/inventory", requireAdmin, (request, response) => {
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
  const character = characterRepository.setInventoryItemForPlayer(characterIdResult.data, auth.sub, {
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

adminRouter.post("/characters/:characterId/refund-skills", requireAdmin, (request, response) => {
  const characterIdResult = z.string().safeParse(request.params.characterId);

  if (!characterIdResult.success) {
    response.status(404).json({ error: "Character not found" });
    return;
  }

  const auth = response.locals.auth as AuthTokenPayload;
  const character = characterRepository.refundSkillsForPlayer(characterIdResult.data, auth.sub);

  if (!character) {
    response.status(404).json({ error: "Character not found" });
    return;
  }

  response.json({ character: toPublicCharacter(character) });
});
