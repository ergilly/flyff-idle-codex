import {
  clampResourceValue,
  getConsumableCooldownMs,
  getRecoveryAbility,
  getRecoveryInventoryItems
} from "@/lib/battle/recovery";
import { buildCharacter, buildItem } from "@/test/fixtures";

describe("battle recovery", () => {
  it("selects and sorts matching recovery inventory", () => {
    const hpSmall = buildItem({
      id: "small",
      name: "Zulu",
      category: "recovery hp",
      cooldown: 2.5,
      abilities: [{ parameter: "HP", add: 100, rate: false }]
    });
    const hpLarge = buildItem({
      id: "large",
      name: "Alpha",
      category: "Recovery",
      abilities: [{ parameter: "hp", add: 200, rate: false }]
    });
    const hpLargeB = buildItem({
      id: "large-b",
      name: "Beta",
      category: "Recovery",
      abilities: [{ parameter: "hp", add: 200, rate: false }]
    });
    const character = buildCharacter({
      inventory: {
        size: 50,
        items: [
          { slotIndex: 0, itemId: "small", quantity: 1 },
          { slotIndex: 1, itemId: "large-b", quantity: 1 },
          { slotIndex: 2, itemId: "large", quantity: 1 },
          { slotIndex: 3, itemId: "missing", quantity: 1 }
        ]
      }
    });

    expect(clampResourceValue(undefined, 100)).toBe(100);
    expect(clampResourceValue(-1, 100)).toBe(0);
    expect(clampResourceValue(120, 100)).toBe(100);
    expect(getRecoveryAbility(hpSmall, "hp")?.add).toBe(100);
    expect(getRecoveryAbility(hpSmall, "mp")).toBeNull();
    expect(getConsumableCooldownMs(hpSmall)).toBe(2500);
    expect(getConsumableCooldownMs(buildItem({ cooldown: 0 }))).toBe(0);
    expect(
      getRecoveryInventoryItems(character, { small: hpSmall, large: hpLarge, "large-b": hpLargeB }, "hp").map(
        ({ item }) => item.id
      )
    ).toEqual(["large", "large-b", "small"]);
  });
});
