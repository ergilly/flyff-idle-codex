import { fireEvent, render, screen } from "@testing-library/react";
import { Button } from "./Button";

it("forwards button behavior and applies the selected variant", () => {
  const onClick = jest.fn();
  render(
    <Button onClick={onClick} variant="secondary">
      Cancel
    </Button>
  );
  fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
  expect(onClick).toHaveBeenCalledTimes(1);
  expect(screen.getByRole("button")).toHaveClass("border-border");
});
