import type { TownShop } from "../../../shops/shopTypes.js";
import { LudaMerchant } from "./armory/luda.js";
import { BobokuMerchant } from "./armory/boboku.js";
import { BobokoMerchant } from "./armory/boboko.js";

export const FlarineTownArmoryShop = {
  id: "flarine-town/armory",
  merchantNames: ["Luda", "Boboku", "Boboko"],
  merchants: [LudaMerchant, BobokuMerchant, BobokoMerchant]
} satisfies TownShop;
