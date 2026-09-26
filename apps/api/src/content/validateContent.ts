import { loadShopCatalog } from "./contentLoader.js";
import { getQuestContent } from "./questContent.js";
import { loadGeneratedItemIndex } from "./generatedContent.js";
import { loadStoredDataSet } from "../gameData/gameData.database.js";
import { getJobLineage } from "../data/jobProgression.js";
import { getFlyingItemTier } from "../data/flyingItemProgression.js";
import { startingMainhand } from "../data/starterLoadout.js";

const knownItemIds = new Set(
  Object.values(loadStoredDataSet("items")).flatMap((item) =>
    item.id === undefined || item.id === null ? [] : [String(item.id)]
  )
);
const shopCatalog = loadShopCatalog(undefined, { knownItemIds });
const itemIndex = loadGeneratedItemIndex();
getQuestContent("0");
getJobLineage("Vagrant");
getFlyingItemTier(startingMainhand);
console.log(
  `Validated ${Object.keys(shopCatalog).length} shops, ${Object.keys(itemIndex).length} generated item records, and authored progression content.`
);
