import { render, screen } from "@testing-library/react";
import { StatLabel, StatRow } from "./StatRow";

it("connects stable test ids to a stat label and value", () => {
  render(<StatRow data-testid="strength" label="STR" value={15} />);
  expect(screen.getByTestId("strength_label")).toHaveTextContent("STR");
  expect(screen.getByTestId("strength_value")).toHaveTextContent("15");
});

it("allows the shared stat label to be used independently", () => {
  render(<StatLabel data-testid="label">DEX</StatLabel>);
  expect(screen.getByTestId("label")).toHaveClass("text-text-muted");
});
