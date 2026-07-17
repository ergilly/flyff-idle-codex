import type { TownShop } from "../../../../shops/shopTypes.js";
import { BobokoMercenaryTab } from "./boboko/mercenary.js";
import { BobokoAssistTab } from "./boboko/assist.js";
import { BobokoAcrobatTab } from "./boboko/acrobat.js";

export const BobokoMerchant = {
  id: "1872",
  name: "Boboko",
  tabs: [BobokoMercenaryTab, BobokoAssistTab, BobokoAcrobatTab]
} satisfies TownShop["merchants"][number];
