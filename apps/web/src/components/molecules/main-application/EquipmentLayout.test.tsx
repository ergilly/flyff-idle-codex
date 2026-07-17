import { fireEvent, render, screen } from "@testing-library/react";
import { EquipmentSetSelector, EquipmentSlot } from "./EquipmentLayout";

describe("EquipmentLayout", () => {
  it("exposes equipment-set state and selection accessibly", () => {
    const onChange = jest.fn();
    render(<EquipmentSetSelector activeEquipmentSet={1} onEquipmentSetChange={onChange} />);

    expect(screen.getByRole("button", { name: "Equipment set 2" })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: "Equipment set 3" }));
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it("preserves slot button semantics and frame positioning", () => {
    render(
      <EquipmentSlot
        $equipped
        $frame="left-1"
        $selected={false}
        $twoHandedOccupied={false}
        aria-label="Main Hand: Sword"
      />
    );

    const slot = screen.getByRole("button", { name: "Main Hand: Sword" });
    expect(slot).toHaveAttribute("data-frame", "left-1");
    expect(slot).toHaveStyle({ top: "10.069444%" });
  });
});
