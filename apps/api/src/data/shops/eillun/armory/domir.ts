import type { TownShop } from "../../../../shops/shopTypes.js";
import { DomirMercenaryTab } from "./domir/mercenary.js";
import { DomirAssistTab } from "./domir/assist.js";
import { DomirMagicianTab } from "./domir/magician.js";
import { DomirAcrobatTab } from "./domir/acrobat.js";

export const DomirMerchant = {
  id: "33101",
  name: "Domir",
  tabs: [DomirMercenaryTab, DomirAssistTab, DomirMagicianTab, DomirAcrobatTab]
} satisfies TownShop["merchants"][number];
