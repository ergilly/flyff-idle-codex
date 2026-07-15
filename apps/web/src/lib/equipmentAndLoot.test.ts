import type { Character, MonsterFamilyVariant } from "@/lib/api";
import {
  canEquipItem,
  getEquipmentSlotForItem,
  isItemRequirementUnmet,
  meetsRequiredJob
} from "@/lib/itemEquipment";
import {
  addDroppedItems,
  formatBattleValue,
  getDropCategory,
  isQuestDropItem,
  removeDroppedItems,
  rollMonsterDrops,
  rollMonsterPenya
} from "@/lib/battle/loot";
import {
  clampResourceValue,
  getConsumableCooldownMs,
  getRecoveryAbility,
  getRecoveryInventoryItems
} from "@/lib/battle/recovery";
import {
  getChangedEquipmentSlot,
  getCharacterEquipmentSet,
  getEquippedItemIds
} from "@/lib/characterEquipment";
import { buildCharacter, buildItem, emptyEquipment } from "@/test/fixtures";

const character = (overrides: Partial<Character> = {}) =>
  buildCharacter({ job: "Slayer", level: 80, ...overrides });
const item = buildItem;

describe("equipment rules", () => {
  it("recognizes job lineage and item requirements", () => {
    expect(meetsRequiredJob(character(), "blade")).toBe(true);
    expect(meetsRequiredJob(character(), "Mercenary")).toBe(true);
    expect(meetsRequiredJob(character(), "vag rant")).toBe(true);
    expect(meetsRequiredJob(character(), "Assist")).toBe(false);
    expect(isItemRequirementUnmet("Gender", item({ sex: "female" }), character())).toBe(true);
    expect(isItemRequirementUnmet("Req Job", item({ requiredJob: "Assist" }), character())).toBe(true);
    expect(isItemRequirementUnmet("Level", item({ level: 81 }), character())).toBe(true);
    expect(isItemRequirementUnmet("Level", item({ level: null }), character())).toBe(false);
    expect(isItemRequirementUnmet("Other", item(), character())).toBe(false);
    expect(isItemRequirementUnmet("Gender", item({ sex: "female" }))).toBe(false);
  });

  it.each([
    [item({ category: "flying" }), "flying"],
    [item({ category: "arrow" }), "ammo"],
    [item({ category: "jewelry", subcategory: "necklace" }), "necklace"],
    [item({ category: "jewelry", subcategory: "earring" }), "earringL"],
    [item({ category: "jewelry", subcategory: "ring" }), "ringL"],
    [item({ category: "armor", subcategory: "helmet" }), "helmet"],
    [item({ category: "armor", subcategory: "suit" }), "suit"],
    [item({ category: "armor", subcategory: "gauntlet" }), "gloves"],
    [item({ category: "armor", subcategory: "gloves" }), "gloves"],
    [item({ category: "armor", subcategory: "boots" }), "boots"],
    [item({ category: "armor", subcategory: "shield" }), "offhand"],
    [item({ category: "fashion", subcategory: "hat" }), "csHelm"],
    [item({ category: "fashion", subcategory: "cloth" }), "csSuit"],
    [item({ category: "fashion", subcategory: "glove" }), "csGloves"],
    [item({ category: "fashion", subcategory: "shoes" }), "csBoots"],
    [item({ category: "fashion", subcategory: "mask" }), "mask"],
    [item({ category: "fashion", subcategory: "visualcloak" }), "cloak"],
    [item({ category: "other" }), null]
  ])("maps %j to its equipment slot", (metadata, expected) => {
    expect(getEquipmentSlotForItem(character(), metadata, emptyEquipment, {})).toBe(expected);
  });

  it("handles paired jewelry, dual wielding, two-handed weapons, and rejected items", () => {
    const occupied = { ...emptyEquipment, earringL: "left", ringL: "left" };
    expect(
      getEquipmentSlotForItem(
        character(),
        item({ category: "jewelry", subcategory: "earring" }),
        occupied,
        {}
      )
    ).toBe("earringR");
    expect(
      getEquipmentSlotForItem(character(), item({ category: "jewelry", subcategory: "ring" }), occupied, {})
    ).toBe("ringR");
    const sword = item({ id: "sword" });
    const wielding = { ...emptyEquipment, mainhand: sword.id };
    expect(getEquipmentSlotForItem(character(), sword, wielding, { sword })).toBe("offhand");
    expect(getEquipmentSlotForItem(character({ job: "Knight" }), sword, wielding, { sword })).toBe(
      "mainhand"
    );
    expect(canEquipItem(character(), item({ level: 100 }), emptyEquipment, {})).toBe(false);
    expect(canEquipItem(character(), item({ category: "other" }), emptyEquipment, {})).toBe(false);
    expect(
      canEquipItem(
        character(),
        item({ category: "armor", subcategory: "shield" }),
        { ...emptyEquipment, mainhand: "great" },
        { great: item({ id: "great", twoHanded: true }) }
      )
    ).toBe(false);
    expect(canEquipItem(character(), sword, emptyEquipment, {})).toBe(true);
  });
});

describe("battle loot and recovery helpers", () => {
  it("formats values and classifies inventory drops by player-facing category", () => {
    expect(formatBattleValue(null)).toBe("Unknown");
    expect(formatBattleValue(0)).toBe("0");
    expect(isQuestDropItem(item({ category: "booty" }))).toBe(true);
    expect(isQuestDropItem(item({ category: "quest item" }))).toBe(true);
    expect(isQuestDropItem(item({ category: null, subcategory: "quest reward" }))).toBe(true);
    expect(isQuestDropItem(undefined)).toBe(false);
    expect(
      [
        item({ consumable: true }),
        item(),
        item({ category: "armor" }),
        item({ category: "accessory" }),
        item({ category: "material" }),
        item({ category: null, subcategory: "sunstone shard" }),
        item({ category: "food" }),
        item({ category: null, subcategory: "large potion" }),
        item({ category: "fashion" }),
        item({ category: "flying" }),
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

  it("selects and sorts matching recovery inventory", () => {
    const hpSmall = item({
      id: "small",
      name: "Zulu",
      category: "recovery hp",
      cooldown: 2.5,
      abilities: [{ parameter: "HP", add: 100, rate: false }]
    });
    const hpLarge = item({
      id: "large",
      name: "Alpha",
      category: "Recovery",
      abilities: [{ parameter: "hp", add: 200, rate: false }]
    });
    const hpLargeB = item({
      id: "large-b",
      name: "Beta",
      category: "Recovery",
      abilities: [{ parameter: "hp", add: 200, rate: false }]
    });
    const c = character({
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
    expect(getConsumableCooldownMs(item({ cooldown: 0 }))).toBe(0);
    expect(
      getRecoveryInventoryItems(c, { small: hpSmall, large: hpLarge, "large-b": hpLargeB }, "hp").map(
        ({ item: value }) => value.id
      )
    ).toEqual(["large", "large-b", "small"]);
  });
});

describe("character equipment sets", () => {
  it("reads all sets, falls back safely, and identifies changes", () => {
    const first = { ...emptyEquipment, helmet: "one" };
    const second = { ...emptyEquipment, suit: "two" };
    const c = character({ equipment: first, equipmentSets: [first, second] });
    expect(getEquippedItemIds(c)).toEqual(["one", "two"]);
    expect(getCharacterEquipmentSet(c, 1)).toBe(second);
    expect(getCharacterEquipmentSet(character({ equipment: first }), 0)).toBe(first);
    expect(getCharacterEquipmentSet(character(), 2)).toEqual(emptyEquipment);
    expect(
      getChangedEquipmentSlot(character({ equipment: first }), character({ equipment: second }), 0)
    ).toBe("helmet");
    expect(getChangedEquipmentSlot(character(), character(), 0)).toBeNull();
  });
});
