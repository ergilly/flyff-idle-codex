import type { TownShop } from "../../../shops/shopTypes.js";

// Local shop layout: edit merchant tabs and item IDs. Item names are reference labels; runtime details come from game data.
export const DarkenCityFoodVendorShop = {
  id: "darken-city/food-vendor",
  merchantNames: ["Bolpor"],
  merchants: [
    {
      id: "1686",
      name: "Bolpor",
      tabs: [
        {
          id: "1686-food-0",
          label: "Food",
          items: [
            {
              id: "5325",
              name: "Lollipop"
            },
            {
              id: "9449",
              name: "Biscuit"
            },
            {
              id: "2940",
              name: "Chocolate Bar"
            },
            {
              id: "5085",
              name: "Milk"
            },
            {
              id: "5443",
              name: "Roll Bread"
            },
            {
              id: "542",
              name: "Hot Dog"
            },
            {
              id: "4388",
              name: "Pizza"
            },
            {
              id: "1124",
              name: "Kimbap"
            },
            {
              id: "4493",
              name: "Chicken Stick"
            },
            {
              id: "4683",
              name: "Star Candy"
            }
          ]
        }
      ]
    }
  ]
} satisfies TownShop;
