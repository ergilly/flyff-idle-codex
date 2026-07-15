import { fireEvent, render, screen } from "@testing-library/react";
import { AllocationButton } from "./AllocationButton";

it("forwards allocation button interactions", () => {
  const onClick = jest.fn();
  render(<AllocationButton onClick={onClick}>+</AllocationButton>);
  fireEvent.click(screen.getByRole("button", { name: "+" }));
  expect(onClick).toHaveBeenCalledTimes(1);
});
