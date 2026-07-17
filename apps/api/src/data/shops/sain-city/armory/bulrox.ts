import type { TownShop } from "../../../../shops/shopTypes.js";
import { BulroxMercenaryTab } from "./bulrox/mercenary.js";
import { BulroxAssistTab } from "./bulrox/assist.js";
import { BulroxAcrobatTab } from "./bulrox/acrobat.js";

export const BulroxMerchant = {
  id: "3199",
  name: "Bulrox",
  tabs: [BulroxMercenaryTab, BulroxAssistTab, BulroxAcrobatTab]
} satisfies TownShop["merchants"][number];
