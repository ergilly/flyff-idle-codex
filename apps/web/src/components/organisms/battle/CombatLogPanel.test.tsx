import { fireEvent, render, screen } from "@testing-library/react";
import { CombatLogPanel } from "./CombatLogPanel";

it("disables clearing an empty log", () => {
  render(<CombatLogPanel battleLog={[]} onClearBattleLog={jest.fn()} />);
  expect(screen.getByRole("button", { name: "Clear" })).toBeDisabled();
  expect(screen.getByText("No combat actions yet.")).toBeInTheDocument();
});

it("renders entry tones and clears populated logs", () => {
  const onClear = jest.fn();
  render(
    <CombatLogPanel
      battleLog={[{ id: 1, message: "Critical hit", tone: "success" }]}
      onClearBattleLog={onClear}
    />
  );
  expect(screen.getByTestId("battle_li_combat_log_1")).toHaveClass("text-[#94e6a7]");
  fireEvent.click(screen.getByRole("button", { name: "Clear" }));
  expect(onClear).toHaveBeenCalledTimes(1);
});

it("limits concise logs to the most recent entries", () => {
  const battleLog = Array.from({ length: 11 }, (_entry, index) => ({
    id: index + 1,
    message: `Action ${index + 1}`,
    tone: "muted" as const
  }));

  render(<CombatLogPanel battleLog={battleLog} detail="concise" onClearBattleLog={jest.fn()} />);

  expect(screen.queryByTestId("battle_li_combat_log_1")).not.toBeInTheDocument();
  expect(screen.getByTestId("battle_li_combat_log_2")).toBeInTheDocument();
  expect(screen.getByTestId("battle_li_combat_log_11")).toBeInTheDocument();
});
