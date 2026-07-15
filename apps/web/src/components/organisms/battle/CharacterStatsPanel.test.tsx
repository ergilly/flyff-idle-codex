import { render, screen } from "@testing-library/react";
import { CharacterStatsPanel } from "./CharacterStatsPanel";

it("groups known combat stats and omits empty groups", () => {
  render(
    <CharacterStatsPanel
      combatStats={[
        { label: "STR", value: "20" },
        { label: "Attack", value: "120" }
      ]}
    />
  );
  expect(screen.getByTestId("battle_div_character_stats_group_attributes")).toHaveTextContent("STR20");
  expect(screen.getByTestId("battle_div_character_stats_group_offense")).toHaveTextContent("Attack120");
  expect(screen.queryByTestId("battle_div_character_stats_group_recovery")).not.toBeInTheDocument();
});
