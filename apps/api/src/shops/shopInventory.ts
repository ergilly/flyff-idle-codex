import { loadShopCatalog } from "../content/contentLoader.js";
import type { TownShop } from "./shopTypes.js";

const catalog: Record<string, TownShop> = loadShopCatalog();

export function getTownShop(townMapId: string, locationId: string) {
  return catalog[`${townMapId}/${locationId}`] ?? null;
}

export function getTownShopStockItem(townMapId: string, locationId: string, itemId: string) {
  const shop = getTownShop(townMapId, locationId);
  return (
    shop?.merchants
      .flatMap((merchant) => merchant.tabs)
      .flatMap((tab) => tab.items)
      .find((item) => item.id === itemId) ?? null
  );
}

export function getFlarineGeneralStoreStockItem(itemId: string) {
  return getTownShopStockItem("flarine-town", "general-store", itemId);
}
