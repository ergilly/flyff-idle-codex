import { FlarineTownGeneralStoreShop } from "./flarine-town/general-store.js";
import { FlarineTownArmoryShop } from "./flarine-town/armory.js";
import { FlarineTownMagicVendorShop } from "./flarine-town/magic-vendor.js";
import { FlarineTownFoodVendorShop } from "./flarine-town/food-vendor.js";
import { FlarineTownStationShop } from "./flarine-town/station.js";
import { SainCityGeneralStoreShop } from "./sain-city/general-store.js";
import { SainCityArmoryShop } from "./sain-city/armory.js";
import { SainCityMagicVendorShop } from "./sain-city/magic-vendor.js";
import { SainCityFoodVendorShop } from "./sain-city/food-vendor.js";
import { SainCityStationShop } from "./sain-city/station.js";
import { DarkenCityGeneralStoreShop } from "./darken-city/general-store.js";
import { DarkenCityArmoryShop } from "./darken-city/armory.js";
import { DarkenCityMagicVendorShop } from "./darken-city/magic-vendor.js";
import { DarkenCityFoodVendorShop } from "./darken-city/food-vendor.js";
import { DarkenCityStationShop } from "./darken-city/station.js";
import { EillunGeneralStoreShop } from "./eillun/general-store.js";
import { EillunArmoryShop } from "./eillun/armory.js";
import { EillunMagicVendorShop } from "./eillun/magic-vendor.js";
import { EillunFoodVendorShop } from "./eillun/food-vendor.js";
import type { TownShop } from "../../shops/shopTypes.js";

// Local, editable shop inventories used by the game at runtime.
export const townShopCatalog: Record<string, TownShop> = {
  "flarine-town/general-store": FlarineTownGeneralStoreShop,
  "flarine-town/armory": FlarineTownArmoryShop,
  "flarine-town/magic-vendor": FlarineTownMagicVendorShop,
  "flarine-town/food-vendor": FlarineTownFoodVendorShop,
  "flarine-town/station": FlarineTownStationShop,
  "sain-city/general-store": SainCityGeneralStoreShop,
  "sain-city/armory": SainCityArmoryShop,
  "sain-city/magic-vendor": SainCityMagicVendorShop,
  "sain-city/food-vendor": SainCityFoodVendorShop,
  "sain-city/station": SainCityStationShop,
  "darken-city/general-store": DarkenCityGeneralStoreShop,
  "darken-city/armory": DarkenCityArmoryShop,
  "darken-city/magic-vendor": DarkenCityMagicVendorShop,
  "darken-city/food-vendor": DarkenCityFoodVendorShop,
  "darken-city/station": DarkenCityStationShop,
  "eillun/general-store": EillunGeneralStoreShop,
  "eillun/armory": EillunArmoryShop,
  "eillun/magic-vendor": EillunMagicVendorShop,
  "eillun/food-vendor": EillunFoodVendorShop
};
