import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../auth/auth.middleware.js";
import { characterRepository } from "../data/characterRepository.js";
import type { AuthTokenPayload } from "../types.js";
import { toPublicCharacter } from "./characterRoute.shared.js";

export const characterConsumablesRouter = Router();

const resourceSchema = z.enum(["hp", "mp", "fp"]);
const equipSchema = z.object({ slotIndex: z.number().int().min(0).max(99).nullable() });

characterConsumablesRouter.post(
  "/:characterId/consumables/:resource",
  requireAuth,
  async (request, response) => {
    const characterId = z.string().safeParse(request.params.characterId);
    const resource = resourceSchema.safeParse(request.params.resource);
    const equip = equipSchema.safeParse(request.body);
    if (!characterId.success || !resource.success || !equip.success) {
      response.status(400).json({ error: "Consumable item is required" });
      return;
    }
    const result = await characterRepository.equipConsumableItemForPlayer(
      characterId.data,
      (response.locals.auth as AuthTokenPayload).sub,
      resource.data,
      equip.data.slotIndex
    );
    if (!result.character) {
      const missing = ["Character not found", "Inventory item not found", "Item not found"].includes(
        result.error ?? ""
      );
      response.status(missing ? 404 : 400).json({ error: result.error ?? "Unable to equip consumable" });
      return;
    }
    response.json({ character: toPublicCharacter(result.character) });
  }
);

characterConsumablesRouter.post(
  "/:characterId/consumables/:resource/consume",
  requireAuth,
  async (request, response) => {
    const characterId = z.string().safeParse(request.params.characterId);
    const resource = resourceSchema.safeParse(request.params.resource);
    if (!characterId.success || !resource.success) {
      response.status(404).json({ error: "Consumable slot not found" });
      return;
    }
    const result = await characterRepository.consumeEquippedConsumableForPlayer(
      characterId.data,
      (response.locals.auth as AuthTokenPayload).sub,
      resource.data
    );
    if (!result.character) {
      const missing = result.error === "Character not found" || result.error === "Consumable slot is empty";
      response.status(missing ? 404 : 400).json({ error: result.error ?? "Unable to consume item" });
      return;
    }
    response.json({ character: toPublicCharacter(result.character) });
  }
);
