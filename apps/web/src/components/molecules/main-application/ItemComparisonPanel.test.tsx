import { render, screen } from "@testing-library/react";
import type { Character, ItemMetadata } from "@/lib/api";
import { ItemComparisonPanel } from "./ItemComparisonPanel";

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

describe("ItemComparisonPanel", () => {
  it("renders changed combat stats and the item being replaced", () => {
    const candidate = item("new", { abilities: [{ parameter: "attack", add: 10, rate: false }] });

    render(
      <ItemComparisonPanel
        character={character}
        item={candidate}
        itemsById={{ old: item("old"), new: candidate }}
      />
    );

    expect(screen.getByTestId("item_comparison_current_item")).toHaveTextContent("Replacing old");
    expect(screen.getByTestId("item_comparison_stats")).toHaveTextContent("Attack");
    expect(screen.getByTestId("item_comparison_stats")).toHaveTextContent("→");
  });

  it("explains why an item cannot be equipped", () => {
    const lockedItem = item("locked", { category: "food", subcategory: null, level: 75 });

    render(
      <ItemComparisonPanel character={character} item={lockedItem} itemsById={{ locked: lockedItem }} />
    );

    expect(screen.getByTestId("item_comparison_requirements")).toHaveTextContent(
      "No compatible equipment slot"
    );
  });
});
