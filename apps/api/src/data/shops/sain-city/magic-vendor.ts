import type { TownShop } from "../../../shops/shopTypes.js";

// Local shop layout: edit merchant tabs and item IDs. Item names are reference labels; runtime details come from game data.
export const SainCityMagicVendorShop = {
  id: "sain-city/magic-vendor",
  merchantNames: ["Martin"],
  merchants: [
    {
      id: "349",
      name: "Martin",
      tabs: [
        {
          id: "349-wand-0",
          label: "Wand",
          items: [
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
            },
            {
              id: "5044",
              name: "Ruby Wand"
            },
            {
              id: "5525",
              name: "Kalis Wand"
            },
            {
              id: "7963",
              name: "Poly Wand"
            },
            {
              id: "920",
              name: "Mekerhill Wand"
            },
            {
              id: "2216",
              name: "Naz Wand"
            },
            {
              id: "6634",
              name: "Zerem Wand"
            }
          ]
        },
        {
          id: "349-staff-1",
          label: "Staff",
          items: [
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
            },
            {
              id: "4699",
              name: "Addself Staff"
            },
            {
              id: "4795",
              name: "Sign Staff"
            },
            {
              id: "854",
              name: "Ignis Staff"
            },
            {
              id: "6730",
              name: "Teba Staff"
            },
            {
              id: "8701",
              name: "Sline Staff"
            },
            {
              id: "9923",
              name: "Starwheel Staff"
            }
          ]
        },
        {
          id: "349-magic-tools-2",
          label: "Magic Tools",
          items: [
            {
              id: "8815",
              name: "Blinkwing of Flaris"
            },
            {
              id: "6617",
              name: "Blinkwing of Saint Morning"
            },
            {
              id: "4602",
              name: "Blinkwing of Darkon"
            }
          ]
        },
        {
          id: "349-robe-3",
          label: "Robe",
          items: [
            {
              id: "6561",
              name: "Asron Suit"
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
              id: "7969",
              name: "Shuffle Helmet"
            },
            {
              id: "860",
              name: "Shuffle Suit"
            },
            {
              id: "7265",
              name: "Shuffle Gauntlets"
            },
            {
              id: "1172",
              name: "Shuffle Boots"
            },
            {
              id: "715",
              name: "Coring Helmet"
            },
            {
              id: "3000",
              name: "Coring Suit"
            },
            {
              id: "4534",
              name: "Coring Gauntlets"
            },
            {
              id: "3056",
              name: "Coring Boots"
            },
            {
              id: "2083",
              name: "Sapee Suit"
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
            },
            {
              id: "316",
              name: "Jay Helmet"
            },
            {
              id: "8734",
              name: "Jay Suit"
            },
            {
              id: "5538",
              name: "Jay Gauntlets"
            },
            {
              id: "9785",
              name: "Jay Boots"
            },
            {
              id: "4536",
              name: "Marble Helmet"
            },
            {
              id: "3340",
              name: "Marble Suit"
            },
            {
              id: "1019",
              name: "Marble Gauntlets"
            },
            {
              id: "7331",
              name: "Marble Boots"
            }
          ]
        }
      ]
    }
  ]
} satisfies TownShop;
