import { fireEvent, render, screen } from "@testing-library/react";
import { CharacterEquipmentPanel, getEquippedItemIds } from "./CharacterEquipmentPanel";
import { buildCharacter, buildItem, emptyEquipment } from "@/test/fixtures";

const sword = buildItem({ id: "3497", name: "Wooden Sword", icon: "sword.png" });

describe("CharacterEquipmentPanel", () => {
  it("selects and unequips an equipped slot", () => {
    const onSelectEquipmentSlot = jest.fn();
    const onUnequipEquipmentSlot = jest.fn();
    const character = buildCharacter({
      equipment: { ...emptyEquipment, mainhand: sword.id }
    });
    render(
      <CharacterEquipmentPanel
        character={character}
        itemsById={{ [sword.id]: sword }}
        onSelectEquipmentSlot={onSelectEquipmentSlot}
        onUnequipEquipmentSlot={onUnequipEquipmentSlot}
        selectedEquipmentSlot="mainhand"
      />
    );

    expect(getEquippedItemIds(character)).toEqual([sword.id]);
    fireEvent.click(screen.getByRole("button", { name: "Main Hand: Wooden Sword" }));
    fireEvent.click(screen.getByRole("button", { name: "Unequip" }));
    expect(onSelectEquipmentSlot).toHaveBeenCalledWith("mainhand");
    expect(onUnequipEquipmentSlot).toHaveBeenCalledWith("mainhand", 0);
  });

  it("distinguishes duplicate equipped items by slot", () => {
    render(
      <CharacterEquipmentPanel
        character={buildCharacter({
          equipment: { ...emptyEquipment, mainhand: sword.id, offhand: sword.id }
        })}
        itemsById={{ [sword.id]: sword }}
        onSelectEquipmentSlot={jest.fn()}
        onUnequipEquipmentSlot={jest.fn()}
        selectedEquipmentSlot="offhand"
      />
    );

    expect(screen.getByRole("button", { name: "Main Hand: Wooden Sword" })).toHaveAttribute(
      "aria-pressed",
      "false"
    );
    expect(screen.getByRole("button", { name: "Off Hand: Wooden Sword" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
  });
});
