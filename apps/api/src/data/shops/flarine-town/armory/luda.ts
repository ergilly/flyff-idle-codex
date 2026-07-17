import type { TownShop } from "../../../../shops/shopTypes.js";
import { LudaWeaponsTab } from "./luda/weapons.js";
import { LudaArmorsTab } from "./luda/armors.js";
import { LudaShieldsTab } from "./luda/shields.js";

export const LudaMerchant = {
  id: "7699",
  name: "Luda",
  tabs: [LudaWeaponsTab, LudaArmorsTab, LudaShieldsTab]
} satisfies TownShop["merchants"][number];
