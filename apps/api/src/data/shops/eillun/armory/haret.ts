import type { TownShop } from "../../../../shops/shopTypes.js";
import { HaretMercenaryTab } from "./haret/mercenary.js";
import { HaretAssistTab } from "./haret/assist.js";
import { HaretAcrobatTab } from "./haret/acrobat.js";

export const HaretMerchant = {
  id: "47410",
  name: "Haret",
  tabs: [HaretMercenaryTab, HaretAssistTab, HaretAcrobatTab]
} satisfies TownShop["merchants"][number];
