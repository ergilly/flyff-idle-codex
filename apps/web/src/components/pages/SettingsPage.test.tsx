import { fireEvent, render, screen } from "@testing-library/react";
import { SettingsPage } from "./SettingsPage";

test("changes the autosave interval", () => {
  const onChange = jest.fn();
  render(<SettingsPage autosaveIntervalSeconds={60} onAutosaveIntervalChange={onChange} />);
  fireEvent.change(screen.getByTestId("settings_select_autosave_interval"), { target: { value: "120" } });
  expect(onChange).toHaveBeenCalledWith(120);
});
