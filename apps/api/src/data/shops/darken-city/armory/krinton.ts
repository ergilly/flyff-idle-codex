import type { TownShop } from "../../../../shops/shopTypes.js";
import { KrintonShieldsTab } from "./krinton/shields.js";

export const KrintonMerchant = {
  id: "7290",
  name: "Krinton",
  tabs: [KrintonShieldsTab]
} satisfies TownShop["merchants"][number];
