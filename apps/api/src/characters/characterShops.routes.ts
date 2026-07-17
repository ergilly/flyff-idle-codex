import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { requireAuth } from "../auth/auth.middleware.js";
import { characterRepository } from "../data/characterRepository.js";
import { getItemData, getNumberField } from "../data/characterInventoryRepository.js";
import { getTownShopStockItem } from "../shops/shopInventory.js";
import type { AuthTokenPayload } from "../types.js";
import { toPublicCharacter } from "./characterRoute.shared.js";

export const characterShopsRouter = Router();

const purchaseSchema = z.object({
  itemId: z.string().regex(/^\d+$/),
  quantity: z.number().int().min(1).max(9_999)
});
const saleSchema = z.object({
  quantity: z.number().int().min(1).max(9_999),
  slotIndex: z.number().int().min(0).max(99)
});

async function purchaseShopItem(request: Request, response: Response, townMapId: string, locationId: string) {
  const characterId = z.string().safeParse(request.params.characterId);
  const purchase = purchaseSchema.safeParse(request.body);
  if (!characterId.success || !purchase.success) {
    response.status(400).json({ error: "Shop item is required" });
    return;
  }

  const stockItem = getTownShopStockItem(townMapId, locationId, purchase.data.itemId);
  if (!stockItem) {
    response.status(404).json({ error: "Shop item not found" });
    return;
  }
  const itemData = getItemData(stockItem.id);
  const maxStack = Math.max(1, getNumberField(itemData, "stack") ?? 1);
  if (purchase.data.quantity > maxStack) {
    response.status(400).json({ error: "Quantity exceeds the item's maximum stack" });
    return;
  }
  const unitPrice = getNumberField(itemData, "buyPrice");
  if (unitPrice === null || unitPrice <= 0) {
    response.status(400).json({ error: "This item cannot be purchased" });
    return;
  }
  const result = characterRepository.purchaseInventoryItemForPlayer(
    characterId.data,
    (response.locals.auth as AuthTokenPayload).sub,
    purchase.data.itemId,
    purchase.data.quantity,
    unitPrice,
    maxStack
  );
  if (!result.character) {
    response.status(result.error === "Character not found" ? 404 : 400).json({
      error: result.error ?? "Unable to purchase item"
    });
    return;
  }
  response.json({ character: toPublicCharacter(result.character) });
}

characterShopsRouter.post(
  "/:characterId/shops/flarine-general-store/purchases",
  requireAuth,
  (request, response) => purchaseShopItem(request, response, "flarine-town", "general-store")
);

characterShopsRouter.post(
  "/:characterId/shops/:townMapId/:locationId/purchases",
  requireAuth,
  (request, response) =>
    purchaseShopItem(request, response, String(request.params.townMapId), String(request.params.locationId))
);

characterShopsRouter.post("/:characterId/shops/sales", requireAuth, (request, response) => {
  const characterId = z.string().safeParse(request.params.characterId);
  const sale = saleSchema.safeParse(request.body);
  if (!characterId.success || !sale.success) {
    response.status(400).json({ error: "Inventory item and quantity are required" });
    return;
  }
  const auth = response.locals.auth as AuthTokenPayload;
  const character = characterRepository.findById(characterId.data);
  const inventoryItem = character?.inventory.items.find((item) => item.slotIndex === sale.data.slotIndex);
  if (!character || character.playerId !== auth.sub) {
    response.status(404).json({ error: "Character not found" });
    return;
  }
  if (!inventoryItem) {
    response.status(404).json({ error: "Inventory item not found" });
    return;
  }
  const unitPrice = getNumberField(getItemData(inventoryItem.itemId), "sellPrice");
  if (unitPrice === null || unitPrice <= 0) {
    response.status(400).json({ error: "This item cannot be sold" });
    return;
  }
  const result = characterRepository.sellInventoryItemForPlayer(
    character.id,
    auth.sub,
    inventoryItem.slotIndex,
    sale.data.quantity,
    unitPrice
  );
  if (!result.character) {
    response.status(400).json({ error: result.error ?? "Unable to sell item" });
    return;
  }
  response.json({ character: toPublicCharacter(result.character) });
});
