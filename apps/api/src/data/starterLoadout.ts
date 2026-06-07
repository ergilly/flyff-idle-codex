import type { CharacterGender } from "../types.js";

export const startingInventoryItems = [
  { slotIndex: 0, itemId: "5325", quantity: 3 },
  { slotIndex: 1, itemId: "9449", quantity: 1 },
  { slotIndex: 2, itemId: "3896", quantity: 5 }
];

export const startingEquipmentByGender: Record<
  CharacterGender,
  {
    suit: string;
    gloves: string;
    boots: string;
  }
> = {
  female: {
    suit: "6040",
    gloves: "5011",
    boots: "8195"
  },
  male: {
    suit: "3314",
    gloves: "5535",
    boots: "4750"
  }
};

export const startingMainhand = "3497";
