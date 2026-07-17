import type { TownShop } from "../../../../shops/shopTypes.js";
import { RoockyMercenaryTab } from "./roocky/mercenary.js";
import { RoockyAssistTab } from "./roocky/assist.js";
import { RoockyAcrobatTab } from "./roocky/acrobat.js";

export const RoockyMerchant = {
  id: "5395",
  name: "Roocky",
  tabs: [RoockyMercenaryTab, RoockyAssistTab, RoockyAcrobatTab]
} satisfies TownShop["merchants"][number];
