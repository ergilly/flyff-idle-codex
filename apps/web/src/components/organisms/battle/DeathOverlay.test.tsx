import { fireEvent, render, screen } from "@testing-library/react";
import { DeathOverlay } from "./DeathOverlay";

it("requires the player to choose to respawn", () => {
  const onRespawn = jest.fn();
  render(<DeathOverlay isRespawning={false} onRespawn={onRespawn} townName="Sain City" />);

  expect(screen.getByRole("dialog", { name: "You died" })).toBeInTheDocument();
  expect(screen.getByText("Respawn at Sain City to continue.")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Respawn at town" }));
  expect(onRespawn).toHaveBeenCalledTimes(1);
});
