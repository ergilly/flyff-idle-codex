import { loadShopCatalog } from "./contentLoader.js";
import { loadStoredDataSet } from "../gameData/gameData.database.js";

const knownItemIds = new Set(
  Object.values(loadStoredDataSet("items")).flatMap((item) =>
    item.id === undefined || item.id === null ? [] : [String(item.id)]
  )
);
const shopCatalog = loadShopCatalog(undefined, { knownItemIds });
console.log(`Validated ${Object.keys(shopCatalog).length} local shops.`);
