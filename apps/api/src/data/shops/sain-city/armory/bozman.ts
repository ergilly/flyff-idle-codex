import type { TownShop } from "../../../../shops/shopTypes.js";
import { BozmanMercenaryTab } from "./bozman/mercenary.js";
import { BozmanAssistTab } from "./bozman/assist.js";
import { BozmanAcrobatTab } from "./bozman/acrobat.js";

export const BozmanMerchant = {
  id: "7940",
  name: "Bozman",
  tabs: [BozmanMercenaryTab, BozmanAssistTab, BozmanAcrobatTab]
} satisfies TownShop["merchants"][number];
