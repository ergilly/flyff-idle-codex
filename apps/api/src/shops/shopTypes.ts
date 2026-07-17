export type ShopStockItem = {
  id: string;
  /** Readability label only. Runtime item names come from game data. */
  name: string;
};

export type TownShop = {
  id: string;
  merchantNames: string[];
  merchants: Array<{
    id: string;
    name: string;
    tabs: Array<{
      id: string;
      label: string;
      items: ShopStockItem[];
    }>;
  }>;
};
