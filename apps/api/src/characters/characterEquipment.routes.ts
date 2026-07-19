import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../auth/auth.middleware.js";
import { characterRepository } from "../data/characterRepository.js";
import type { AuthTokenPayload } from "../types.js";
import { toPublicCharacter } from "./characterRoute.shared.js";

export const characterEquipmentRouter = Router();

const equipmentSlotSchema = z.enum([
  "helmet",
  "suit",
  "gloves",
  "boots",
  "flying",
  "csBoots",
  "csGloves",
  "csSuit",
  "csHelm",
  "mask",
  "cloak",
  "ammo",
  "offhand",
  "mainhand",
  "ringR",
  "earringR",
  "necklace",
  "earringL",
  "ringL"
]);
const equipmentSetSchema = z
  .object({
    equipmentSet: z.number().int().min(0).max(2).optional()
  })
  .optional();

characterEquipmentRouter.post(
  "/:characterId/inventory/:slotIndex/equip",
  requireAuth,
  async (request, response) => {
    const characterId = z.string().safeParse(request.params.characterId);
    const slotIndex = z.coerce.number().int().min(0).max(99).safeParse(request.params.slotIndex);
    const equipmentSet = equipmentSetSchema.safeParse(request.body);
    if (!characterId.success || !slotIndex.success || !equipmentSet.success) {
      response.status(404).json({ error: "Inventory item not found" });
      return;
    }
    const result = await characterRepository.equipInventoryItemForPlayer(
      characterId.data,
      (response.locals.auth as AuthTokenPayload).sub,
      slotIndex.data,
      (equipmentSet.data?.equipmentSet ?? 0) as 0 | 1 | 2
    );
    if (!result.character) {
      response
        .status(
          result.error === "Character not found" || result.error === "Inventory item not found" ? 404 : 400
        )
        .json({ error: result.error ?? "Unable to equip item" });
      return;
    }
    response.json({ character: toPublicCharacter(result.character) });
  }
);

characterEquipmentRouter.post(
  "/:characterId/equipment/ammo/consume",
  requireAuth,
  async (request, response) => {
    const characterId = z.string().safeParse(request.params.characterId);
    const equipmentSet = equipmentSetSchema.safeParse(request.body);
    if (!characterId.success || !equipmentSet.success) {
      response.status(400).json({ error: "A valid equipment set is required" });
      return;
    }
    const result = await characterRepository.consumeEquippedArrowForPlayer(
      characterId.data,
      (response.locals.auth as AuthTokenPayload).sub,
      (equipmentSet.data?.equipmentSet ?? 0) as 0 | 1 | 2
    );
    if (!result.character) {
      response
        .status(result.error === "Character not found" ? 404 : 400)
        .json({ error: result.error ?? "Unable to consume equipped arrow" });
      return;
    }
    response.json({ character: toPublicCharacter(result.character) });
  }
);

characterEquipmentRouter.post(
  "/:characterId/equipment/:equipmentSlot/unequip",
  requireAuth,
  async (request, response) => {
    const characterId = z.string().safeParse(request.params.characterId);
    const equipmentSlot = equipmentSlotSchema.safeParse(request.params.equipmentSlot);
    const equipmentSet = equipmentSetSchema.safeParse(request.body);
    if (!characterId.success || !equipmentSlot.success || !equipmentSet.success) {
      response.status(404).json({ error: "Equipment slot not found" });
      return;
    }
    const result = await characterRepository.unequipItemForPlayer(
      characterId.data,
      (response.locals.auth as AuthTokenPayload).sub,
      equipmentSlot.data,
      (equipmentSet.data?.equipmentSet ?? 0) as 0 | 1 | 2
    );
    if (!result.character) {
      response
        .status(
          result.error === "Character not found" || result.error === "Equipment slot is empty" ? 404 : 400
        )
        .json({ error: result.error ?? "Unable to unequip item" });
      return;
    }
    response.json({ character: toPublicCharacter(result.character) });
  }
);
