import type { TownShop } from "../../../../shops/shopTypes.js";
import { RemineMercenaryTab } from "./remine/mercenary.js";
import { RemineAssistTab } from "./remine/assist.js";
import { RemineAcrobatTab } from "./remine/acrobat.js";

export const RemineMerchant = {
  id: "3573",
  name: "Remine",
  tabs: [RemineMercenaryTab, RemineAssistTab, RemineAcrobatTab]
} satisfies TownShop["merchants"][number];
