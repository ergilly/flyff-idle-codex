import { fireEvent, render, screen } from "@testing-library/react";
import { SettingsPage } from "./SettingsPage";

test("changes the autosave interval", () => {
  const onChange = jest.fn();
  render(<SettingsPage autosaveIntervalSeconds={60} onAutosaveIntervalChange={onChange} />);
  fireEvent.change(screen.getByTestId("settings_select_autosave_interval"), { target: { value: "120" } });
  expect(onChange).toHaveBeenCalledWith(120);
});

test("offers long autosave intervals", () => {
  render(<SettingsPage autosaveIntervalSeconds={300} onAutosaveIntervalChange={jest.fn()} />);
  expect(screen.getByRole("option", { name: "5 minutes" })).toBeInTheDocument();
  expect(screen.getByRole("option", { name: "10 minutes" })).toBeInTheDocument();
  expect(screen.getByRole("option", { name: "30 minutes" })).toBeInTheDocument();
});
