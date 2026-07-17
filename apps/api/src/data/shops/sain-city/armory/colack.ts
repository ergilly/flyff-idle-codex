import type { TownShop } from "../../../../shops/shopTypes.js";
import { ColackShieldsTab } from "./colack/shields.js";

export const ColackMerchant = {
  id: "2941",
  name: "Colack",
  tabs: [ColackShieldsTab]
} satisfies TownShop["merchants"][number];
