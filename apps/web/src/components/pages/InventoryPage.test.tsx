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

    fireEvent.click(screen.getByRole("button", { name: "Equip" }));
    expect(onEquipSlot).toHaveBeenCalledWith(0);
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
    expect(screen.getByRole("button", { name: "Equip" })).toBeDisabled();
    expect(screen.getByText("Unable to equip item")).toBeInTheDocument();
  });
});
