import { render, screen } from "@testing-library/react";
import { CharacterCombatHeader } from "./CharacterCombatHeader";

it("renders character resources and attack timing", () => {
  render(
    <CharacterCombatHeader
      attackTiming={{ attacksPerSecond: 0.5, secondsPerAttack: 2 }}
      characterFp={30}
      characterMaxFp={40}
      characterHp={80}
      characterMaxHp={100}
      characterMp={20}
      characterMaxMp={50}
      isCombatInProgress
    />
  );
  expect(screen.getByTestId("battle_character_header_hp_span_status_value")).toHaveTextContent("80 / 100");
  expect(screen.getByTestId("battle_character_header_mp_span_status_value")).toHaveTextContent("20 / 50");
  expect(screen.getByTestId("battle_character_header_fp_span_status_value")).toHaveTextContent("30 / 40");
  expect(screen.getByTestId("battle_div_timeline_fill_player_attack")).toHaveStyle({
    animation: "battle-attack-fill 2s linear infinite"
  });
});
