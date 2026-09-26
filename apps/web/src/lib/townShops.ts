import { type ItemMetadata } from "@/lib/api/types";

export type ShopInventoryItem = ItemMetadata & {
  icon: string;
  maxStack: number;
  price: number;
};

export type ShopInventoryTab = {
  id: string;
  label: string;
  items: ShopInventoryItem[];
};

export type TownShop = {
  id: string;
  merchantNames: string[];
  merchants: ShopMerchant[];
};

export type ShopMerchant = {
  id: string;
  name: string;
  tabs: ShopInventoryTab[];
};
