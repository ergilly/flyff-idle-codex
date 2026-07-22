import { fireEvent, render, screen } from "@testing-library/react";
import { InventoryPage } from "./InventoryPage";
import type { Character, ItemMetadata } from "@/lib/api";

const equipment = {
  helmet: null,
  suit: "3314",
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
  mainhand: "3497",
  ringR: null,
  earringR: null,
  necklace: null,
  earringL: null,
  ringL: null
};

const character: Character = {
  id: "char-1",
  slotIndex: 0,
  name: "Saint Morning",
  gender: "female",
  job: "Vagrant",
  progressionRank: "normal",
  level: 12,
  exp: 0,
  penya: 150,
  stats: { str: 15, sta: 15, dex: 15, int: 15 },
  skillLevels: {},
  equipment,
  inventory: {
    size: 5,
    items: [
      { slotIndex: 0, itemId: "3497", quantity: 1 },
      { slotIndex: 2, itemId: "5325", quantity: 3 }
    ]
  }
};

const woodenSword: ItemMetadata = {
  id: "3497",
  name: "Wooden Sword",
  description: "A basic Wooden Sword for new adventurers.",
  icon: "weaswowooden.png",
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
  abilities: []
};

const biscuit: ItemMetadata = {
  id: "5325",
  name: "Biscuit",
  description: null,
  icon: null,
  category: "food",
  subcategory: null,
  rarity: "common",
  level: 1,
  sex: null,
  requiredJob: null,
  minAttack: null,
  maxAttack: null,
  attackSpeed: null,
  twoHanded: null,
  minDefense: null,
  maxDefense: null,
  stack: 9999,
  abilities: []
};

const alesGauntlets: ItemMetadata = {
  id: "822",
  name: "Ales Gauntlets",
  description: null,
  icon: null,
  category: "armor",
  subcategory: "gauntlet",
  rarity: "common",
  level: 75,
  sex: "male",
  requiredJob: "Billposter",
  minAttack: null,
  maxAttack: null,
  attackSpeed: null,
  twoHanded: null,
  minDefense: 270,
  maxDefense: 272,
  stack: 1,
  abilities: []
};

describe("InventoryPage", () => {
  it("renders occupied slots, selects items, and equips the selected slot", () => {
    const onEquipSlot = jest.fn();
    const onSelectSlot = jest.fn();

    render(
      <InventoryPage
        character={character}
        itemsById={{ "3497": woodenSword, "5325": biscuit }}
        onEquipSlot={onEquipSlot}
        onSelectSlot={onSelectSlot}
        selectedSlotIndex={0}
      />
    );

    expect(screen.getByText("2 / 5 occupied")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Slot 1: Wooden Sword, quantity 1" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(screen.getByRole("complementary", { name: "Wooden Sword details" })).toHaveAttribute(
      "data-slot",
      "Inventory 1"
    );

    fireEvent.click(screen.getByRole("button", { name: "Slot 3: Biscuit, quantity 3" }));
    expect(onSelectSlot).toHaveBeenCalledWith(2);

    fireEvent.click(screen.getByRole("button", { name: "Slot 2: Empty" }));
    expect(onSelectSlot).toHaveBeenCalledWith(null);

    fireEvent.click(screen.getByRole("button", { name: "Equip to set 2" }));
    expect(onEquipSlot).toHaveBeenCalledWith(0, 1);
  });

  it("sorts inventory and reports drag-and-drop moves", () => {
    const onMoveItem = jest.fn();
    const onSortInventory = jest.fn();

    render(
      <InventoryPage
        character={character}
        itemsById={{ "3497": woodenSword, "5325": biscuit }}
        onMoveItem={onMoveItem}
        onSelectSlot={jest.fn()}
        onSortInventory={onSortInventory}
        selectedSlotIndex={null}
      />
    );

    fireEvent.change(screen.getByLabelText("Sort"), { target: { value: "name" } });
    expect(onSortInventory).toHaveBeenCalledWith("name");

    fireEvent.drop(screen.getByRole("button", { name: "Slot 5: Empty" }), {
      dataTransfer: {
        getData: () => "2"
      }
    });
    expect(onMoveItem).toHaveBeenCalledWith(2, 4);
  });

  it("shows item details while an occupied slot is hovered or focused", () => {
    render(
      <InventoryPage
        character={character}
        itemsById={{ "3497": woodenSword, "5325": biscuit }}
        onSelectSlot={jest.fn()}
        selectedSlotIndex={0}
      />
    );

    const biscuitSlot = screen.getByRole("button", { name: "Slot 3: Biscuit, quantity 3" });
    fireEvent.mouseEnter(biscuitSlot);
    expect(screen.getByTestId("item_details_hover_overlay")).toBeInTheDocument();
    expect(screen.getByRole("complementary", { name: "Biscuit details" })).toBeInTheDocument();
    fireEvent.mouseLeave(biscuitSlot);
    expect(screen.queryByRole("complementary", { name: "Biscuit details" })).not.toBeInTheDocument();

    fireEvent.focus(biscuitSlot);
    expect(screen.getByRole("complementary", { name: "Biscuit details" })).toBeInTheDocument();
    fireEvent.blur(biscuitSlot);
    expect(screen.queryByRole("complementary", { name: "Biscuit details" })).not.toBeInTheDocument();
  });

  it("disables actions while an inventory request is pending", () => {
    render(
      <InventoryPage
        actionError="Unable to equip item"
        character={character}
        isActionPending
        itemsById={{ "3497": woodenSword }}
        onEquipSlot={jest.fn()}
        onSelectSlot={jest.fn()}
        selectedSlotIndex={0}
      />
    );

    expect(screen.getByLabelText("Sort")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Equip to set 1" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Equip to set 2" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Equip to set 3" })).toBeDisabled();
    expect(screen.getByText("Unable to equip item")).toBeInTheDocument();
  });

  it("does not show equip actions for items without an equipment slot", () => {
    render(
      <InventoryPage
        character={character}
        itemsById={{ "5325": biscuit }}
        onEquipSlot={jest.fn()}
        onSelectSlot={jest.fn()}
        selectedSlotIndex={2}
      />
    );

    expect(screen.getByRole("complementary", { name: "Biscuit details" })).toBeInTheDocument();
    expect(screen.queryByTestId("inventory_div_equip_actions")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Equip to set 1" })).not.toBeInTheDocument();
  });

  it("does not show equip actions for items with unmet requirements", () => {
    const requirementCharacter: Character = {
      ...character,
      inventory: {
        size: 5,
        items: [{ slotIndex: 0, itemId: "822", quantity: 1 }]
      }
    };

    render(
      <InventoryPage
        character={requirementCharacter}
        itemsById={{ "822": alesGauntlets }}
        onEquipSlot={jest.fn()}
        onSelectSlot={jest.fn()}
        selectedSlotIndex={0}
      />
    );

    expect(screen.getByText("Billposter").parentElement?.getAttribute("class")).toContain(
      "[&_dd]:!text-[#ff4d4d]"
    );
    expect(screen.queryByTestId("inventory_div_equip_actions")).not.toBeInTheDocument();
  });

  it("shows equipped set pieces while inspecting set items in inventory", () => {
    const setCharacter: Character = {
      ...character,
      equipmentSets: [
        {
          ...equipment,
          helmet: "3272",
          suit: "4351",
          mainhand: null
        },
        equipment,
        equipment
      ],
      inventory: {
        size: 5,
        items: [{ slotIndex: 0, itemId: "822", quantity: 1 }]
      }
    };

    render(
      <InventoryPage
        activeEquipmentSet={0}
        character={setCharacter}
        itemsById={{ "822": alesGauntlets }}
        onSelectSlot={jest.fn()}
        selectedSlotIndex={0}
      />
    );

    expect(screen.getByText("Ales Set 2/4")).toBeInTheDocument();
    expect(screen.getByTestId("item_details_span_set_part_3272").getAttribute("class")).toContain(
      "text-[#64d875]"
    );
    expect(screen.getByTestId("item_details_span_set_part_4351").getAttribute("class")).toContain(
      "text-[#64d875]"
    );
    expect(screen.getByTestId("item_details_span_set_part_822").getAttribute("class")).toContain(
      "text-text-muted"
    );
  });
});
