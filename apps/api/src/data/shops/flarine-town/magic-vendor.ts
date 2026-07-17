import type { TownShop } from "../../../shops/shopTypes.js";

// Local shop layout: edit merchant tabs and item IDs. Item names are reference labels; runtime details come from game data.
export const FlarineTownMagicVendorShop = {
  id: "flarine-town/magic-vendor",
  merchantNames: ["Marche"],
  merchants: [
    {
      id: "2150",
      name: "Marche",
      tabs: [
        {
          id: "2150-wand-0",
          label: "Wand",
          items: [
            {
              id: "162",
              name: "Seal Wand"
            },
            {
              id: "1067",
              name: "Cubic Wand"
            },
            {
              id: "1294",
              name: "Epi Wand"
            },
            {
              id: "3856",
              name: "Niz Wand"
            }
          ]
        },
        {
          id: "2150-staff-1",
          label: "Staff",
          items: [
            {
              id: "5006",
              name: "Mile Staff"
            },
            {
              id: "2114",
              name: "Nile Staff"
            },
            {
              id: "7242",
              name: "Inner Staff"
            },
            {
              id: "5255",
              name: "Herald Staff"
            }
          ]
        },
        {
          id: "2150-magic-tools-2",
          label: "Magic Tools",
          items: [
            {
              id: "8815",
              name: "Blinkwing of Flaris"
            },
            {
              id: "6617",
              name: "Blinkwing of Saint Morning"
            }
          ]
        },
        {
          id: "2150-robe-3",
          label: "Robe",
          items: [
            {
              id: "9523",
              name: "Asron Helmet"
            },
            {
              id: "6561",
              name: "Asron Suit"
            },
            {
              id: "33",
              name: "Asron Gauntlets"
            },
            {
              id: "663",
              name: "Asron Boots"
            },
            {
              id: "3753",
              name: "Rodney Helmet"
            },
            {
              id: "9223",
              name: "Rodney Suit"
            },
            {
              id: "1188",
              name: "Rodney Gauntlets"
            },
            {
              id: "2294",
              name: "Rodney Boots"
            },
            {
              id: "8774",
              name: "Sapee Helmet"
            },
            {
              id: "2083",
              name: "Sapee Suit"
            },
            {
              id: "842",
              name: "Sapee Gauntlets"
            },
            {
              id: "5230",
              name: "Sapee Boots"
            },
            {
              id: "3699",
              name: "Fioren Helmet"
            },
            {
              id: "5384",
              name: "Fioren Suit"
            },
            {
              id: "4544",
              name: "Fioren Gauntlets"
            },
            {
              id: "9733",
              name: "Fioren Boots"
            }
          ]
        }
      ]
    }
  ]
} satisfies TownShop;
