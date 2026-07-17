import type { TownShop } from "../../../../../shops/shopTypes.js";

export const ColackShieldsTab = {
  id: "2941-shields-0",
  label: "Shields",
  items: [
    {
      id: "8312",
      name: "Sparkle Shield"
    },
    {
      id: "5242",
      name: "Shurain Shield"
    },
    {
      id: "5175",
      name: "Gyro Shield"
    },
    {
      id: "2856",
      name: "Vortex Shield"
    },
    {
      id: "2090",
      name: "Plus Shield"
    },
    {
      id: "582",
      name: "Plate Shield"
    }
  ]
} satisfies TownShop["merchants"][number]["tabs"][number];
