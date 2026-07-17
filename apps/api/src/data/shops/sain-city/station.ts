import type { TownShop } from "../../../shops/shopTypes.js";

export const SainCityStationShop = {
  id: "sain-city/station",
  merchantNames: ["Tina"],
  merchants: [
    {
      id: "5983",
      name: "Tina",
      tabs: [
        {
          id: "5983-broom-0",
          label: "Broom",
          items: [
            { id: "8507", name: "Magic Broom" },
            { id: "2128", name: "Kestrel Broom" },
            { id: "3258", name: "Flicker Broom" },
            { id: "7336", name: "Projan Broom" }
          ]
        },
        {
          id: "5983-board-1",
          label: "Board",
          items: [
            { id: "7182", name: "Hover Board" },
            { id: "4482", name: "Aero Board" },
            { id: "6333", name: "Wilduck Board" },
            { id: "4715", name: "Ignice Board" }
          ]
        }
      ]
    }
  ]
} satisfies TownShop;
