import { fireEvent, render, screen } from "@testing-library/react";
import { ProfileMenuButton } from "./ProfileMenuButton";

it("forwards profile menu button content and interactions", () => {
  const onClick = jest.fn();
  render(<ProfileMenuButton onClick={onClick}>Sign out</ProfileMenuButton>);
  fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
  expect(onClick).toHaveBeenCalledTimes(1);
});
