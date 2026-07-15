import type { MonsterFamilyVariant } from "@/lib/api";
import {
  addDroppedItems,
  formatBattleValue,
  getDropCategory,
  isQuestDropItem,
  removeDroppedItems,
  rollMonsterDrops,
  rollMonsterPenya
} from "@/lib/battle/loot";
import { buildItem } from "@/test/fixtures";

describe("battle loot", () => {
  it("formats values and classifies drops by player-facing category", () => {
    expect(formatBattleValue(null)).toBe("Unknown");
    expect(formatBattleValue(0)).toBe("0");
    expect(isQuestDropItem(buildItem({ category: "booty" }))).toBe(true);
    expect(isQuestDropItem(buildItem({ category: "quest item" }))).toBe(true);
    expect(isQuestDropItem(buildItem({ category: null, subcategory: "quest reward" }))).toBe(true);
    expect(isQuestDropItem(undefined)).toBe(false);
    expect(
      [
        buildItem({ consumable: true }),
        buildItem(),
        buildItem({ category: "armor" }),
        buildItem({ category: "accessory" }),
        buildItem({ category: "material" }),
        buildItem({ category: null, subcategory: "sunstone shard" }),
        buildItem({ category: "food" }),
        buildItem({ category: null, subcategory: "large potion" }),
        buildItem({ category: "fashion" }),
        buildItem({ category: "flying" }),
        undefined
      ].map(getDropCategory)
    ).toEqual([
      "consumable",
      "weapon",
      "armor",
      "jewelry",
      "upgradeMaterial",
      "upgradeMaterial",
      "consumable",
      "consumable",
      "fashion",
      "flying",
      "other"
    ]);
  });

  it("rolls, combines, removes, and prices drops deterministically", () => {
    const drops = [
      { item: 1, probabilityRange: "0.5" },
      { item: 2, prob: "25%" },
      { item: 3, prob: "none" }
    ];
    expect(rollMonsterDrops(drops, () => 0.2)).toEqual([
      { itemId: "1", quantity: 1 },
      { itemId: "2", quantity: 1 }
    ]);
    expect(rollMonsterDrops(undefined)).toEqual([]);
    const current = [{ itemId: "1", quantity: 2 }];
    expect(addDroppedItems(current, [])).toBe(current);
    expect(
      addDroppedItems(current, [
        { itemId: "1", quantity: 3 },
        { itemId: "2", quantity: 1 }
      ])
    ).toEqual([
      { itemId: "1", quantity: 5 },
      { itemId: "2", quantity: 1 }
    ]);
    expect(
      removeDroppedItems(
        [
          { itemId: "1", quantity: 5 },
          { itemId: "2", quantity: 1 }
        ],
        [
          { itemId: "1", quantity: 2 },
          { itemId: "2", quantity: 1 }
        ]
      )
    ).toEqual([{ itemId: "1", quantity: 3 }]);
    expect(rollMonsterPenya({ minDropGold: -2, maxDropGold: 3 } as MonsterFamilyVariant, () => 0.5)).toBe(2);
    expect(rollMonsterPenya({ minDropGold: 5, maxDropGold: 2 } as MonsterFamilyVariant, () => 0)).toBe(5);
  });
});
