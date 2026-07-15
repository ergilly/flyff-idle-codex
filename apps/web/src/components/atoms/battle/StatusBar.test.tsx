import { render, screen } from "@testing-library/react";
import { StatusBar } from "./StatusBar";

it.each([
  [50, 100, "50%"],
  [150, 100, "100%"],
  [-5, 100, "0%"],
  [1, 0, "0%"]
] as const)("clamps %s of %s to %s", (value, max, width) => {
  render(<StatusBar label="HP" max={max} testIdPrefix="player" tone="hp" value={value} />);
  expect(screen.getByTestId("player_hp_div_status_fill")).toHaveStyle({ width });
  expect(screen.getByTestId("player_hp_span_status_value")).toHaveTextContent(`${value} / ${max}`);
});
