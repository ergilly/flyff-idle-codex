import { fireEvent, render, screen } from "@testing-library/react";
import { ItemDetailsPanel } from "./ItemDetailsPanel";
import type { Character, ItemMetadata } from "@/lib/api";

const character: Character = {
  id: "char-1",
  slotIndex: 0,
  name: "Requirement Tester",
  gender: "male",
  job: "Blade",
  progressionRank: "normal",
  level: 70,
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
    mainhand: null,
    ringR: null,
    earringR: null,
    necklace: null,
    earringL: null,
    ringL: null
  },
  inventory: { size: 50, items: [] }
};

function item(overrides: Partial<ItemMetadata>): ItemMetadata {
  return {
    id: "item-1",
    name: "Mystery Wand",
    description: "Mystery Wand hums with power.",
    icon: "wand.png",
    category: "weapon",
    subcategory: "wand",
    rarity: "legendary",
    level: 75,
    sex: "female",
    requiredJob: "Psykeeper",
    minAttack: 10,
    maxAttack: 20,
    attackSpeed: "veryfast",
    twoHanded: true,
    minDefense: null,
    maxDefense: null,
    stack: 1,
    abilities: [{ parameter: "max_hp", add: 5, rate: true }],
    ...overrides
  };
}

describe("ItemDetailsPanel", () => {
  it("renders an empty state without an action", () => {
    render(<ItemDetailsPanel emptyDescription="Pick something." item={null} />);

    expect(screen.getByRole("complementary", { name: "Item details" })).toHaveTextContent("Pick something.");
  });

  it("highlights unmet requirements, effects, descriptions, and action errors", () => {
    const onAction = jest.fn();

    render(
      <ItemDetailsPanel
        actionError="Missing requirements"
        actionLabel="Equip"
        character={character}
        item={item({})}
        onAction={onAction}
        slotLabel="Main Hand"
      />
    );

    expect(screen.getByRole("complementary", { name: "Mystery Wand details" })).toHaveAttribute(
      "data-slot",
      "Main Hand"
    );
    expect(screen.getByText("Two-Handed Weapon")).toBeInTheDocument();
    expect(screen.getByText("Very Fast")).toBeInTheDocument();
    expect(screen.getByText("Psykeeper")).toBeInTheDocument();
    expect(screen.getByText("Max HP +5%")).toBeInTheDocument();
    expect(screen.getByText("Awakening Available")).toBeInTheDocument();
    expect(screen.getByText("Missing requirements")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Equip" }));
    expect(onAction).toHaveBeenCalled();
  });

  it("renders met requirements, defense ranges, awakening stats, and non-awakenable fashion", () => {
    const { rerender } = render(
      <ItemDetailsPanel
        awakeningStats={[{ parameter: "str", add: -2, rate: false }]}
        character={{ ...character, gender: "female", job: "Mentalist", level: 130 }}
        item={item({
          category: "armor",
          subcategory: "suit",
          minAttack: null,
          maxAttack: null,
          attackSpeed: null,
          twoHanded: null,
          minDefense: 100,
          maxDefense: 120,
          requiredJob: "Psykeeper"
        })}
      />
    );

    expect(screen.getByText("Defense")).toBeInTheDocument();
    expect(screen.getByText("100 - 120")).toBeInTheDocument();
    expect(screen.getByText("Str -2")).toBeInTheDocument();
    expect(screen.queryByText("Awakening Available")).not.toBeInTheDocument();

    rerender(
      <ItemDetailsPanel
        character={character}
        item={item({
          category: "fashion",
          subcategory: "visualcloak",
          description: "No highlighted name here.",
          level: null,
          minAttack: null,
          maxAttack: null,
          sex: null,
          requiredJob: null,
          twoHanded: null,
          abilities: []
        })}
      />
    );

    expect(screen.getByText("No highlighted name here.")).toBeInTheDocument();
    expect(screen.queryByText("Awakening Available")).not.toBeInTheDocument();
  });

  it("renders set effects with active and inactive bonus states", () => {
    render(
      <ItemDetailsPanel
        character={character}
        equippedItemIds={["3272", "4351", "822"]}
        item={item({
          id: "3272",
          name: "Ales Helmet",
          category: "armor",
          subcategory: "helmet",
          abilities: []
        })}
      />
    );

    expect(screen.getByText("Ales Set 3/4")).toBeInTheDocument();
    expect(screen.getByText("Ales Set 3/4").getAttribute("class")).toContain("text-text-muted");
    expect(screen.getByTestId("item_details_span_set_part_3272")).toHaveTextContent("Ales Helmet");
    expect(screen.getByTestId("item_details_span_set_part_3272").getAttribute("class")).toContain(
      "text-[#64d875]"
    );
    expect(screen.getByTestId("item_details_span_set_part_4351")).toHaveTextContent("Ales Suit");
    expect(screen.getByTestId("item_details_span_set_part_4351").getAttribute("class")).toContain(
      "text-[#64d875]"
    );
    expect(screen.getByTestId("item_details_span_set_part_822")).toHaveTextContent("Ales Gauntlets");
    expect(screen.getByTestId("item_details_span_set_part_822").getAttribute("class")).toContain(
      "text-[#64d875]"
    );
    expect(screen.getByTestId("item_details_span_set_part_5969")).toHaveTextContent("Ales Boots");
    expect(screen.getByTestId("item_details_span_set_part_5969").getAttribute("class")).toContain(
      "text-text-muted"
    );

    expect(screen.getByText("Defense +43")).toBeInTheDocument();
    expect(screen.getByText("Defense +43").getAttribute("class")).toContain("text-[#f59e0b]");
    expect(screen.getByText("Hit Rate +15%")).toBeInTheDocument();
    expect(screen.getByText("Attack Speed +15%")).toBeInTheDocument();
    expect(screen.queryByText("Critical Chance +15%")).not.toBeInTheDocument();
  });
});
