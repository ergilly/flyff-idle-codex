import type { TownShop } from "../../../shops/shopTypes.js";

// Local shop layout: edit merchant tabs and item IDs. Item names are reference labels; runtime details come from game data.
export const DarkenCityGeneralStoreShop = {
  id: "darken-city/general-store",
  merchantNames: ["Achaben"],
  merchants: [
    {
      id: "265",
      name: "Achaben",
      tabs: [
        {
          id: "265-poster-1",
          label: "Poster",
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
          id: "265-magic-tools-2",
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
              id: "4700",
              name: "Sixth Refresher"
            },
            {
              id: "3872",
              name: "Seventh Refresher"
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
            },
            {
              id: "4069",
              name: "VitalDrink 600"
            },
            {
              id: "4370",
              name: "VitalDrink 700"
            },
            {
              id: "3343",
              name: "Gray Pill"
            },
            {
              id: "7116",
              name: "Yellow Pill"
            },
            {
              id: "3574",
              name: "Blue Pill"
            }
          ]
        },
        {
          id: "265-arrow-3",
          label: "Arrow",
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
