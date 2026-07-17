import type { TownShop } from "../../../shops/shopTypes.js";
import { BulroxMerchant } from "./armory/bulrox.js";
import { BozmanMerchant } from "./armory/bozman.js";
import { ColackMerchant } from "./armory/colack.js";

export const SainCityArmoryShop = {
  id: "sain-city/armory",
  merchantNames: ["Bulrox", "Bozman", "Colack"],
  merchants: [BulroxMerchant, BozmanMerchant, ColackMerchant]
} satisfies TownShop;
