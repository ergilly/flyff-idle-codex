export type ShopStockItem = {
  id: string;
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
