import {
  getChangedEquipmentSlot,
  getCharacterEquipmentSet,
  getEquippedItemIds
} from "@/lib/characterEquipment";
import { buildCharacter, emptyEquipment } from "@/test/fixtures";

describe("characterEquipment", () => {
  it("reads all sets, falls back safely, and identifies changes", () => {
    const first = { ...emptyEquipment, helmet: "one" };
    const second = { ...emptyEquipment, suit: "two" };
    const character = buildCharacter({ equipment: first, equipmentSets: [first, second] });
    expect(getEquippedItemIds(character)).toEqual(["one", "two"]);
    expect(getCharacterEquipmentSet(character, 1)).toBe(second);
    expect(getCharacterEquipmentSet(buildCharacter({ equipment: first }), 0)).toBe(first);
    expect(getCharacterEquipmentSet(buildCharacter(), 2)).toEqual(emptyEquipment);
    expect(
      getChangedEquipmentSlot(buildCharacter({ equipment: first }), buildCharacter({ equipment: second }), 0)
    ).toBe("helmet");
    expect(getChangedEquipmentSlot(buildCharacter(), buildCharacter(), 0)).toBeNull();
  });
});
