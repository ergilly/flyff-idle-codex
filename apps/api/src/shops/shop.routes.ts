import { Router } from "express";
import { findItemsByIds } from "../items/itemIconRepository.js";
import { getTownShop } from "./shopInventory.js";

export const shopRouter = Router();

shopRouter.get("/:townMapId/:locationId", (request, response) => {
  const shop = getTownShop(request.params.townMapId, request.params.locationId);

  if (!shop) {
    response.status(404).json({ error: "Shop not found" });
    return;
  }

  const itemMetadataById = new Map(
    findItemsByIds(
      shop.merchants.flatMap((merchant) => merchant.tabs.flatMap((tab) => tab.items.map((item) => item.id)))
    ).map((item) => [item.id, item])
  );
  const enrichedShop = {
    ...shop,
    merchants: shop.merchants.map((merchant) => ({
      ...merchant,
      tabs: merchant.tabs.map((tab) => ({
        ...tab,
        items: tab.items.map((item) => {
          const metadata = itemMetadataById.get(item.id);
          return {
            ...metadata,
            id: item.id,
            maxStack: Math.max(1, metadata?.stack ?? 1),
            price: metadata?.buyPrice ?? 0
          };
        })
      }))
    }))
  };

  response.json({ shop: enrichedShop });
});
