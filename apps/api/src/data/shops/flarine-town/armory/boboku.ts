import type { TownShop } from "../../../../shops/shopTypes.js";
import { BobokuMercenaryTab } from "./boboku/mercenary.js";
import { BobokuAssistTab } from "./boboku/assist.js";
import { BobokuAcrobatTab } from "./boboku/acrobat.js";

export const BobokuMerchant = {
  id: "4239",
  name: "Boboku",
  tabs: [BobokuMercenaryTab, BobokuAssistTab, BobokuAcrobatTab]
} satisfies TownShop["merchants"][number];
