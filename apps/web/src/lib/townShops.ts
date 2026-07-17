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

export const flarineGeneralStoreTabs: ShopInventoryTab[] = [
  {
    id: "posters",
    label: "Posters",
    items: [
      item("5869", "Skill Poster", "weasecbilcharm.png", 50),
      item("3907", "Bless Poster", "weasecrincharm.png", 50)
    ]
  },
  {
    id: "magic-tools",
    label: "Magic Tools",
    items: [
      item("7809", "First Refresher", "genpotrefr01.png", 330),
      item("8840", "Second Refresher", "genpotrefr02.png", 390),
      item("3868", "Third Refresher", "genpotrefr03.png", 440),
      item("5933", "Fourth Refresher", "genpotrefr04.png", 500),
      item("4758", "Fifth Refresher", "genpotrefr05.png", 520),
      item("2476", "VitalDrink 100", "genpotdrivitlow.png", 324),
      item("6443", "VitalDrink 200", "genpotdrivitlow2.png", 387),
      item("8367", "VitalDrink 300", "genpotdrivitlow3.png", 435),
      item("7153", "VitalDrink 400", "genpotdrivitmid.png", 495),
      item("942", "VitalDrink 500", "genpotdrivitmid2.png", 516)
    ]
  },
  {
    id: "arrows",
    label: "Arrows",
    items: [item("4586", "Arrows", "weasecarrowbox.png", 1)]
  }
];

function item(id: string, name: string, icon: string, price: number): ShopInventoryItem {
  return {
    abilities: [],
    attackSpeed: null,
    category: null,
    description: null,
    icon,
    id,
    level: null,
    maxAttack: null,
    maxDefense: null,
    maxStack: 9_999,
    minAttack: null,
    minDefense: null,
    name,
    price,
    rarity: null,
    requiredJob: null,
    sex: null,
    subcategory: null,
    twoHanded: null
  };
}
