import type { TownShop } from "../../../../shops/shopTypes.js";
import { ToranShieldsTab } from "./toran/shields.js";

export const ToranMerchant = {
  id: "22336",
  name: "Toran",
  tabs: [ToranShieldsTab]
} satisfies TownShop["merchants"][number];
