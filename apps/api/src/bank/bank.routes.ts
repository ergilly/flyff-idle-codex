import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../auth/auth.middleware.js";
import { bankRepository } from "./bankRepository.js";
import type { AuthTokenPayload } from "../types.js";
import { toPublicCharacter } from "../characters/characterRoute.shared.js";

export const bankRouter = Router();

const directionSchema = z.enum(["deposit", "withdraw"]);
const itemTransferSchema = z.object({
  direction: directionSchema,
  slotIndex: z.number().int().min(0).max(99)
});
const allItemsTransferSchema = z.object({ direction: directionSchema });
const penyaTransferSchema = z.object({
  direction: directionSchema,
  amount: z.union([z.number().int().min(1).max(Number.MAX_SAFE_INTEGER), z.literal("all")])
});

function sendResult(
  response: import("express").Response,
  transfer: ReturnType<typeof bankRepository.transferItem>
) {
  if (!transfer.bank || !transfer.character) {
    response.status(transfer.error === "Character not found" ? 404 : 400).json({ error: transfer.error });
    return;
  }
  response.json({ bank: transfer.bank, character: toPublicCharacter(transfer.character) });
}

bankRouter.get("/:characterId/bank", requireAuth, (request, response) => {
  const characterId = z.string().min(1).safeParse(request.params.characterId);
  if (!characterId.success) {
    response.status(404).json({ error: "Character not found" });
    return;
  }
  const auth = response.locals.auth as AuthTokenPayload;
  const result = bankRepository.findForCharacter(auth.sub, characterId.data);
  if (!result) {
    response.status(404).json({ error: "Character not found" });
    return;
  }
  response.json({ bank: result.bank, character: toPublicCharacter(result.character) });
});

bankRouter.post("/:characterId/bank/items", requireAuth, (request, response) => {
  const characterId = z.string().safeParse(request.params.characterId);
  const transfer = itemTransferSchema.safeParse(request.body);
  if (!characterId.success || !transfer.success) {
    response.status(400).json({ error: "A bank direction and inventory slot are required" });
    return;
  }
  const auth = response.locals.auth as AuthTokenPayload;
  sendResult(
    response,
    bankRepository.transferItem(characterId.data, auth.sub, transfer.data.direction, transfer.data.slotIndex)
  );
});

bankRouter.post("/:characterId/bank/items/all", requireAuth, (request, response) => {
  const characterId = z.string().safeParse(request.params.characterId);
  const transfer = allItemsTransferSchema.safeParse(request.body);
  if (!characterId.success || !transfer.success) {
    response.status(400).json({ error: "A bank direction is required" });
    return;
  }
  const auth = response.locals.auth as AuthTokenPayload;
  sendResult(response, bankRepository.transferAllItems(characterId.data, auth.sub, transfer.data.direction));
});

bankRouter.post("/:characterId/bank/penya", requireAuth, (request, response) => {
  const characterId = z.string().safeParse(request.params.characterId);
  const transfer = penyaTransferSchema.safeParse(request.body);
  if (!characterId.success || !transfer.success) {
    response.status(400).json({ error: "A bank direction and Penya amount are required" });
    return;
  }
  const auth = response.locals.auth as AuthTokenPayload;
  sendResult(
    response,
    bankRepository.transferPenya(characterId.data, auth.sub, transfer.data.direction, transfer.data.amount)
  );
});
