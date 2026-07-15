import { render, screen } from "@testing-library/react";
import { AttackTimeline } from "./AttackTimeline";

it("shows an inactive timeline without animation", () => {
  render(<AttackTimeline attackIntervalSeconds={2.45} isActive={false} label="Player attack" />);
  expect(screen.getByTestId("battle_div_timeline_speed_player_attack")).toHaveTextContent("2.5s");
  expect(screen.getByTestId("battle_div_timeline_fill_player_attack")).toHaveStyle({
    transform: "scaleX(0)"
  });
});

it("animates active timelines with a safe minimum duration and danger tone", () => {
  render(<AttackTimeline attackIntervalSeconds={0} isActive label="Monster attack" tone="danger" />);
  expect(screen.getByTestId("battle_div_timeline_fill_monster_attack")).toHaveStyle({
    animation: "battle-attack-fill 0.1s linear infinite"
  });
  expect(screen.getByTestId("battle_div_timeline_fill_monster_attack")).toHaveClass("from-[#ff7b58]");
});
