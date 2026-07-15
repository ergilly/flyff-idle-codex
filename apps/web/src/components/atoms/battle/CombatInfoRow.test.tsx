import { render, screen } from "@testing-library/react";
import { InfoRow } from "./CombatInfoRow";

it("renders a labeled battle value with stable ids", () => {
  render(<InfoRow label="Hit Rate" value="95%" />);
  expect(screen.getByTestId("battle_span_info_label_hit_rate")).toHaveTextContent("Hit Rate");
  expect(screen.getByTestId("battle_strong_info_value_hit_rate")).toHaveTextContent("95%");
});
