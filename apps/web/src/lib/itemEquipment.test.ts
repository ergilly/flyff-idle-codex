import type { Character } from "@/lib/api";
import {
  canEquipItem,
  getEquipmentSlotForItem,
  isItemRequirementUnmet,
  meetsRequiredJob
} from "@/lib/itemEquipment";
import { buildCharacter, buildItem, emptyEquipment } from "@/test/fixtures";

const character = (overrides: Partial<Character> = {}) =>
  buildCharacter({ job: "Slayer", level: 80, ...overrides });

describe("itemEquipment", () => {
  it("recognizes job lineage and item requirements", () => {
    expect(meetsRequiredJob(character(), "blade")).toBe(true);
    expect(meetsRequiredJob(character(), "Mercenary")).toBe(true);
    expect(meetsRequiredJob(character(), "vag rant")).toBe(true);
    expect(meetsRequiredJob(character(), "Assist")).toBe(false);
    expect(isItemRequirementUnmet("Gender", buildItem({ sex: "female" }), character())).toBe(true);
    expect(isItemRequirementUnmet("Req Job", buildItem({ requiredJob: "Assist" }), character())).toBe(true);
    expect(isItemRequirementUnmet("Level", buildItem({ level: 81 }), character())).toBe(true);
    expect(isItemRequirementUnmet("Level", buildItem({ level: null }), character())).toBe(false);
    expect(isItemRequirementUnmet("Other", buildItem(), character())).toBe(false);
    expect(isItemRequirementUnmet("Gender", buildItem({ sex: "female" }))).toBe(false);
  });

  it.each([
    [buildItem({ category: "flying" }), "flying"],
    [buildItem({ category: "arrow" }), "ammo"],
    [buildItem({ category: "jewelry", subcategory: "necklace" }), "necklace"],
    [buildItem({ category: "jewelry", subcategory: "earring" }), "earringL"],
    [buildItem({ category: "jewelry", subcategory: "ring" }), "ringL"],
    [buildItem({ category: "armor", subcategory: "helmet" }), "helmet"],
    [buildItem({ category: "armor", subcategory: "suit" }), "suit"],
    [buildItem({ category: "armor", subcategory: "gauntlet" }), "gloves"],
    [buildItem({ category: "armor", subcategory: "gloves" }), "gloves"],
    [buildItem({ category: "armor", subcategory: "boots" }), "boots"],
    [buildItem({ category: "armor", subcategory: "shield" }), "offhand"],
    [buildItem({ category: "fashion", subcategory: "hat" }), "csHelm"],
    [buildItem({ category: "fashion", subcategory: "cloth" }), "csSuit"],
    [buildItem({ category: "fashion", subcategory: "glove" }), "csGloves"],
    [buildItem({ category: "fashion", subcategory: "shoes" }), "csBoots"],
    [buildItem({ category: "fashion", subcategory: "mask" }), "mask"],
    [buildItem({ category: "fashion", subcategory: "visualcloak" }), "cloak"],
    [buildItem({ category: "other" }), null]
  ])("maps an item to equipment slot %s", (metadata, expected) => {
    expect(getEquipmentSlotForItem(character(), metadata, emptyEquipment, {})).toBe(expected);
  });

  it("handles paired jewelry, dual wielding, two-handed weapons, and rejected items", () => {
    const occupied = { ...emptyEquipment, earringL: "left", ringL: "left" };
    expect(
      getEquipmentSlotForItem(
        character(),
        buildItem({ category: "jewelry", subcategory: "earring" }),
        occupied,
        {}
      )
    ).toBe("earringR");
    expect(
      getEquipmentSlotForItem(
        character(),
        buildItem({ category: "jewelry", subcategory: "ring" }),
        occupied,
        {}
      )
    ).toBe("ringR");
    const sword = buildItem({ id: "sword" });
    const wielding = { ...emptyEquipment, mainhand: sword.id };
    expect(getEquipmentSlotForItem(character(), sword, wielding, { sword })).toBe("offhand");
    expect(getEquipmentSlotForItem(character({ job: "Knight" }), sword, wielding, { sword })).toBe(
      "mainhand"
    );
    expect(canEquipItem(character(), buildItem({ level: 100 }), emptyEquipment, {})).toBe(false);
    expect(canEquipItem(character(), buildItem({ category: "other" }), emptyEquipment, {})).toBe(false);
    expect(
      canEquipItem(
        character(),
        buildItem({ category: "armor", subcategory: "shield" }),
        { ...emptyEquipment, mainhand: "great" },
        { great: buildItem({ id: "great", twoHanded: true }) }
      )
    ).toBe(false);
    expect(canEquipItem(character(), sword, emptyEquipment, {})).toBe(true);
  });
});
