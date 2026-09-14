import { fireEvent, render, screen } from "@testing-library/react";
import { SettingsPage } from "./SettingsPage";

const defaultProps = {
  autosaveIntervalSeconds: 60,
  combatLogDetail: "expanded" as const,
  compactInventoryGrid: false,
  reducedMotion: false,
  onAutosaveIntervalChange: jest.fn(),
  onCombatLogDetailChange: jest.fn(),
  onCompactInventoryGridChange: jest.fn(),
  onReducedMotionChange: jest.fn()
};

test("changes the autosave interval", () => {
  const onChange = jest.fn();
  render(<SettingsPage {...defaultProps} onAutosaveIntervalChange={onChange} />);
  fireEvent.change(screen.getByTestId("settings_select_autosave_interval"), { target: { value: "120" } });
  expect(onChange).toHaveBeenCalledWith(120);
});

test("offers long autosave intervals", () => {
  render(<SettingsPage {...defaultProps} autosaveIntervalSeconds={300} />);
  expect(screen.getByTestId("settings_panel_preferences")).toHaveClass("h-full", "min-h-0");
  expect(screen.getByRole("option", { name: "5 minutes" })).toBeInTheDocument();
  expect(screen.getByRole("option", { name: "10 minutes" })).toBeInTheDocument();
  expect(screen.getByRole("option", { name: "30 minutes" })).toBeInTheDocument();
});

test("changes gameplay preferences", () => {
  const onCombatLogDetailChange = jest.fn();
  const onCompactInventoryGridChange = jest.fn();
  const onReducedMotionChange = jest.fn();
  render(
    <SettingsPage
      {...defaultProps}
      onCombatLogDetailChange={onCombatLogDetailChange}
      onCompactInventoryGridChange={onCompactInventoryGridChange}
      onReducedMotionChange={onReducedMotionChange}
    />
  );

  fireEvent.change(screen.getByTestId("settings_select_combat_log_detail"), {
    target: { value: "concise" }
  });
  fireEvent.click(screen.getByTestId("settings_input_compact_inventory"));
  fireEvent.click(screen.getByTestId("settings_input_reduced_motion"));

  expect(onCombatLogDetailChange).toHaveBeenCalledWith("concise");
  expect(onCompactInventoryGridChange).toHaveBeenCalledWith(true);
  expect(onReducedMotionChange).toHaveBeenCalledWith(true);
});
