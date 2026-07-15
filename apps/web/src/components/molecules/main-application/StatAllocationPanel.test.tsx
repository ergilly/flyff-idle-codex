import { fireEvent, render, screen } from "@testing-library/react";
import { StatAllocationPanel } from "./StatAllocationPanel";
import { buildCharacter } from "@/test/fixtures";

describe("StatAllocationPanel", () => {
  it("dispatches pending stat editing actions", () => {
    const onAddStat = jest.fn();
    const onRemoveStat = jest.fn();
    const onApplyStats = jest.fn();
    const onClearStat = jest.fn();
    const onMaxStat = jest.fn();
    const onResetStats = jest.fn();
    const onSetStat = jest.fn();
    render(
      <StatAllocationPanel
        appliedStats={{ str: 1, sta: 0, dex: 0, int: 0 }}
        availableStatPoints={2}
        character={buildCharacter()}
        onAddStat={onAddStat}
        onApplyStats={onApplyStats}
        onClearStat={onClearStat}
        onMaxStat={onMaxStat}
        onRemoveStat={onRemoveStat}
        onResetStats={onResetStats}
        onSetStat={onSetStat}
        pendingStats={{ str: 1, sta: 0, dex: 0, int: 0 }}
        statKeys={["str", "sta", "dex", "int"]}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Add STR point" }));
    fireEvent.click(screen.getByRole("button", { name: "Assign all available points to STR" }));
    fireEvent.click(screen.getByRole("button", { name: "Remove all pending STR points" }));
    fireEvent.click(screen.getByRole("button", { name: "Remove pending STR point" }));
    fireEvent.change(screen.getByRole("spinbutton", { name: "Pending STR points" }), {
      target: { value: "2" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Apply" }));
    fireEvent.click(screen.getByRole("button", { name: "Reset" }));

    expect(onAddStat).toHaveBeenCalledWith("str");
    expect(onMaxStat).toHaveBeenCalledWith("str");
    expect(onClearStat).toHaveBeenCalledWith("str");
    expect(onRemoveStat).toHaveBeenCalledWith("str");
    expect(onSetStat).toHaveBeenCalledWith("str", 2);
    expect(onApplyStats).toHaveBeenCalled();
    expect(onResetStats).toHaveBeenCalled();
  });
});
