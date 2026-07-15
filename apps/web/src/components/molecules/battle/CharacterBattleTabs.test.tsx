import { fireEvent, render, screen } from "@testing-library/react";
import { CharacterBattleTabs } from "./CharacterBattleTabs";

it("marks the active tab and reports tab changes", () => {
  const onTabChange = jest.fn();
  render(<CharacterBattleTabs activeTab="equipment" onTabChange={onTabChange} />);
  expect(screen.getByRole("button", { name: "Equipment" })).toHaveAttribute("aria-pressed", "true");
  fireEvent.click(screen.getByRole("button", { name: "Skills" }));
  expect(onTabChange).toHaveBeenCalledWith("skills");
});
