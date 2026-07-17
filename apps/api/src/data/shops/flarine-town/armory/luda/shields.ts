import type { TownShop } from "../../../../../shops/shopTypes.js";

export const LudaShieldsTab = {
  id: "7699-shields-2",
  label: "Shields",
  items: [
    {
      id: "5018",
      name: "Green Shield"
    },
    {
      id: "8045",
      name: "Round Shield"
    },
    {
      id: "7458",
      name: "Sentinel Shield"
    },
    {
      id: "8312",
      name: "Sparkle Shield"
    },
    {
      id: "5242",
      name: "Shurain Shield"
    }
  ]
} satisfies TownShop["merchants"][number]["tabs"][number];
