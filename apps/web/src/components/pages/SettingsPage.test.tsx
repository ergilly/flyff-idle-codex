import { fireEvent, render, screen } from "@testing-library/react";
import { SettingsPage } from "./SettingsPage";

const defaultProps = {
  autosaveIntervalSeconds: 60,
  onAutosaveIntervalChange: jest.fn()
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
