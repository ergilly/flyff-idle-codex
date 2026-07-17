import type { TownShop } from "../../../shops/shopTypes.js";

// Local shop layout: edit merchant tabs and item IDs. Item names are reference labels; runtime details come from game data.
export const FlarineTownGeneralStoreShop = {
  id: "flarine-town/general-store",
  merchantNames: ["Lui"],
  merchants: [
    {
      id: "850",
      name: "Lui",
      tabs: [
        {
          id: "850-poster-1",
          label: "Posters",
          items: [
            {
              id: "3907",
              name: "Bless Poster"
            },
            {
              id: "5869",
              name: "Skill Poster"
            }
          ]
        },
        {
          id: "850-magic-tools-2",
          label: "Magic Tools",
          items: [
            {
              id: "7809",
              name: "First Refresher"
            },
            {
              id: "8840",
              name: "Second Refresher"
            },
            {
              id: "3868",
              name: "Third Refresher"
            },
            {
              id: "5933",
              name: "Fourth Refresher"
            },
            {
              id: "4758",
              name: "Fifth Refresher"
            },
            {
              id: "2476",
              name: "VitalDrink 100"
            },
            {
              id: "6443",
              name: "VitalDrink 200"
            },
            {
              id: "8367",
              name: "VitalDrink 300"
            },
            {
              id: "7153",
              name: "VitalDrink 400"
            },
            {
              id: "942",
              name: "VitalDrink 500"
            }
          ]
        },
        {
          id: "850-arrows-3",
          label: "Arrows",
          items: [
            {
              id: "4586",
              name: "Arrows"
            }
          ]
        }
      ]
    }
  ]
} satisfies TownShop;
