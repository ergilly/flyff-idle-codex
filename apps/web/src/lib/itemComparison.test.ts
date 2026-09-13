import type { Character, ItemMetadata } from "@/lib/api";
import { getItemComparison } from "./itemComparison";

const character: Character = {
  id: "char-1",
  slotIndex: 0,
  name: "Comparison Tester",
  gender: "male",
  job: "Vagrant",
  progressionRank: "normal",
  level: 12,
  exp: 0,
  penya: 0,
  stats: { str: 15, sta: 15, dex: 15, int: 15 },
  skillLevels: {},
  equipment: {
    helmet: null,
    suit: null,
    gloves: null,
    boots: null,
    flying: null,
    csBoots: null,
    csGloves: null,
    csSuit: null,
    csHelm: null,
    mask: null,
    cloak: null,
    ammo: null,
    offhand: null,
    mainhand: "old",
    ringR: null,
    earringR: null,
    necklace: null,
    earringL: null,
    ringL: null
  },
  inventory: { size: 20, items: [] }
};

function item(id: string, overrides: Partial<ItemMetadata> = {}): ItemMetadata {
  return {
    id,
    name: id,
    description: null,
    icon: null,
    category: "weapon",
    subcategory: "sword",
    rarity: "common",
    level: 1,
    sex: null,
    requiredJob: null,
    minAttack: 5,
    maxAttack: 7,
    attackSpeed: "fast",
    twoHanded: false,
    minDefense: null,
    maxDefense: null,
    stack: 1,
    abilities: [],
    ...overrides
  };
}

describe("getItemComparison", () => {
  it("returns derived combat stat changes for a replacement item", () => {
    const candidate = item("new", { abilities: [{ parameter: "attack", add: 10, rate: false }] });
    const result = getItemComparison(character, candidate, { old: item("old"), new: candidate });

    expect(result.canEquip).toBe(true);
    expect(result.currentItem?.id).toBe("old");
    expect(result.targetSlot).toBe("mainhand");
    expect(result.rows.find((row) => row.label === "Attack")).toMatchObject({
      direction: "increase"
    });
  });

  it("returns specific requirement errors for unavailable items", () => {
    const result = getItemComparison(
      character,
      item("locked", { level: 75, requiredJob: "Billposter", sex: "female" }),
      { old: item("old"), locked: item("locked") }
    );

    expect(result.canEquip).toBe(false);
    expect(result.rows).toEqual([]);
    expect(result.requirementErrors).toEqual([
      "Requires female character",
      "Requires Billposter",
      "Requires level 75"
    ]);
  });

  it("reports items with no compatible equipment slot", () => {
    const result = getItemComparison(character, item("food", { category: "food", subcategory: null }), {
      old: item("old"),
      food: item("food", { category: "food", subcategory: null })
    });

    expect(result.canEquip).toBe(false);
    expect(result.requirementErrors).toContain("No compatible equipment slot");
  });
});
