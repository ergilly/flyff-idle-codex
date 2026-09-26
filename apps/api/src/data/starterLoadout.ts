import type { CharacterGender } from "../types.js";
import { expectVersion, isRecord, loadAuthoredContent } from "../content/authoredContent.js";

type StarterLoadout = {
  inventory: Array<{ slotIndex: number; itemId: string; quantity: number }>;
  equipment: Record<CharacterGender, { suit: string; gloves: string; boots: string }>;
  mainhand: string;
};

const starterLoadout = loadAuthoredContent("progression/starter-loadout.json", (value, filePath) => {
  const document = expectVersion(value, filePath);

  if (
    !Array.isArray(document.inventory) ||
    !document.inventory.every(
      (item) =>
        isRecord(item) &&
        typeof item.slotIndex === "number" &&
        typeof item.itemId === "string" &&
        typeof item.quantity === "number"
    ) ||
    !isRecord(document.equipment) ||
    !isRecord(document.equipment.female) ||
    !isRecord(document.equipment.male) ||
    !isEquipment(document.equipment.female) ||
    !isEquipment(document.equipment.male) ||
    typeof document.mainhand !== "string"
  ) {
    throw new Error(`Invalid authored content at ${filePath}: starter loadout is invalid`);
  }

  return document as unknown as StarterLoadout;
});

function isEquipment(value: Record<string, unknown>): value is StarterLoadout["equipment"][CharacterGender] {
  return (
    typeof value.suit === "string" && typeof value.gloves === "string" && typeof value.boots === "string"
  );
}

export const startingInventoryItems = starterLoadout.inventory;
export const startingEquipmentByGender = starterLoadout.equipment;
export const startingMainhand = starterLoadout.mainhand;
