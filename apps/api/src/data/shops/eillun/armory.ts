import type { TownShop } from "../../../shops/shopTypes.js";
import { DomirMerchant } from "./armory/domir.js";
import { HaretMerchant } from "./armory/haret.js";
import { ToranMerchant } from "./armory/toran.js";

export const EillunArmoryShop = {
  id: "eillun/armory",
  merchantNames: ["Domir", "Haret", "Toran"],
  merchants: [DomirMerchant, HaretMerchant, ToranMerchant]
} satisfies TownShop;
