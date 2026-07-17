import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../auth/auth.middleware.js";
import { characterRepository } from "../data/characterRepository.js";
import { findItemsByIds } from "../items/itemIconRepository.js";
import type { AuthTokenPayload } from "../types.js";
import { toPublicCharacter } from "./characterRoute.shared.js";

export const characterInventoryRouter = Router();

const moveSchema = z.object({
  fromSlotIndex: z.number().int().min(0).max(99),
  toSlotIndex: z.number().int().min(0).max(99)
});
const lootSchema = z.object({
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
const sortSchema = z.object({ sortBy: z.enum(["name", "level", "job", "category"]) });

characterInventoryRouter.post("/:characterId/inventory/move", requireAuth, async (request, response) => {
  const characterId = z.string().safeParse(request.params.characterId);
  const move = moveSchema.safeParse(request.body);
  if (!characterId.success || !move.success) {
    response.status(400).json({ error: "Source and destination slots are required" });
    return;
  }
  const result = await characterRepository.moveInventoryItemForPlayer(
    characterId.data,
    (response.locals.auth as AuthTokenPayload).sub,
    move.data.fromSlotIndex,
    move.data.toSlotIndex
  );
  if (!result.character) {
    const missing = result.error === "Character not found" || result.error === "Inventory item not found";
    response.status(missing ? 404 : 400).json({ error: result.error ?? "Unable to move item" });
    return;
  }
  response.json({ character: toPublicCharacter(result.character) });
});

characterInventoryRouter.post(
  "/:characterId/inventory/:slotIndex/consume",
  requireAuth,
  async (request, response) => {
    const characterId = z.string().safeParse(request.params.characterId);
    const slotIndex = z.coerce.number().int().min(0).max(99).safeParse(request.params.slotIndex);
    if (!characterId.success || !slotIndex.success) {
      response.status(404).json({ error: "Inventory item not found" });
      return;
    }
    const result = await characterRepository.consumeInventoryItemForPlayer(
      characterId.data,
      (response.locals.auth as AuthTokenPayload).sub,
      slotIndex.data
    );
    if (!result.character) {
      const missing = result.error === "Character not found" || result.error === "Inventory item not found";
      response.status(missing ? 404 : 400).json({ error: result.error ?? "Unable to consume item" });
      return;
    }
    response.json({ character: toPublicCharacter(result.character) });
  }
);

characterInventoryRouter.post("/:characterId/inventory/loot", requireAuth, async (request, response) => {
  const characterId = z.string().safeParse(request.params.characterId);
  const loot = lootSchema.safeParse(request.body);
  if (!characterId.success || !loot.success) {
    response.status(400).json({ error: "Loot items are required" });
    return;
  }
  const itemIds = Array.from(new Set(loot.data.items.map((item) => item.itemId)));
  const foundItemIds = new Set(findItemsByIds(itemIds).map((item) => item.id));
  if (itemIds.some((itemId) => !foundItemIds.has(itemId))) {
    response.status(404).json({ error: "Item not found" });
    return;
  }
  const auth = response.locals.auth as AuthTokenPayload;
  const result = await characterRepository.addInventoryItemsForPlayer(
    characterId.data,
    auth.sub,
    loot.data.items
  );
  if (!result.character) {
    const existingCharacter = characterRepository.findById(characterId.data);
    const isOwnedCharacter = existingCharacter?.playerId === auth.sub;
    response.status(isOwnedCharacter ? 400 : 404).json({
      error: isOwnedCharacter ? (result.error ?? "Not enough inventory space") : "Character not found"
    });
    return;
  }
  response.json({ character: toPublicCharacter(result.character) });
});

characterInventoryRouter.post("/:characterId/inventory/sort", requireAuth, async (request, response) => {
  const characterId = z.string().safeParse(request.params.characterId);
  const sort = sortSchema.safeParse(request.body);
  if (!characterId.success || !sort.success) {
    response.status(400).json({ error: "Sort option is required" });
    return;
  }
  const character = await characterRepository.sortInventoryForPlayer(
    characterId.data,
    (response.locals.auth as AuthTokenPayload).sub,
    sort.data.sortBy
  );
  if (!character) {
    response.status(404).json({ error: "Character not found" });
    return;
  }
  response.json({ character: toPublicCharacter(character) });
});
