import { fireEvent, render, screen } from "@testing-library/react";
import { buildCharacter } from "@/test/fixtures";
import { BattleEquipmentPanel } from "./BattleEquipmentPanel";

jest.mock("@/components/organisms/main-application/CharacterEquipmentPanel", () => ({
  CharacterEquipmentPanel: (props: {
    onEquipmentSetChange: (index: number) => void;
    onSelectEquipmentSlot: (slot: "helmet") => void;
    showItemDetails: boolean;
    variant: string;
  }) => (
    <div
      data-details={String(props.showItemDetails)}
      data-testid="equipment-panel"
      data-variant={props.variant}
    >
      <button onClick={() => props.onEquipmentSetChange(2)}>Set</button>
      <button onClick={() => props.onSelectEquipmentSlot("helmet")}>Slot</button>
    </div>
  )
}));

it("adapts battle equipment props to the shared equipment panel", () => {
  const onSelectEquipmentSet = jest.fn();
  const onSelectEquipmentSlot = jest.fn();
  render(
    <BattleEquipmentPanel
      activeEquipmentSet={1}
      character={buildCharacter()}
      itemsById={{}}
      onSelectEquipmentSet={onSelectEquipmentSet}
      onSelectEquipmentSlot={onSelectEquipmentSlot}
      selectedEquipmentSlot={null}
    />
  );
  expect(screen.getByTestId("equipment-panel")).toHaveAttribute("data-variant", "embedded");
  expect(screen.getByTestId("equipment-panel")).toHaveAttribute("data-details", "false");
  fireEvent.click(screen.getByRole("button", { name: "Set" }));
  fireEvent.click(screen.getByRole("button", { name: "Slot" }));
  expect(onSelectEquipmentSet).toHaveBeenCalledWith(2);
  expect(onSelectEquipmentSlot).toHaveBeenCalledWith("helmet");
});
