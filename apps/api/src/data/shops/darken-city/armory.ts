import type { TownShop } from "../../../shops/shopTypes.js";
import { RemineMerchant } from "./armory/remine.js";
import { RoockyMerchant } from "./armory/roocky.js";
import { KrintonMerchant } from "./armory/krinton.js";

export const DarkenCityArmoryShop = {
  id: "darken-city/armory",
  merchantNames: ["Remine", "Roocky", "Krinton"],
  merchants: [RemineMerchant, RoockyMerchant, KrintonMerchant]
} satisfies TownShop;
