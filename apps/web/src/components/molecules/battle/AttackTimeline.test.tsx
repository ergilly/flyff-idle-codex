import { act, render, screen } from "@testing-library/react";
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

it("renders sequential attack and delay bars for monster timing", () => {
  jest.useFakeTimers();
  render(
    <AttackTimeline
      attackDelaySeconds={6}
      attackIntervalSeconds={1}
      isActive
      label="Monster attack"
      tone="danger"
    />
  );

  const attackFill = screen.getByTestId("battle_div_timeline_fill_monster_attack");
  const delayFill = screen.getByTestId("battle_div_timeline_delay_fill_monster_attack");
  expect(attackFill).toHaveStyle({
    animation: "battle-attack-fill 1s linear forwards"
  });
  expect(delayFill).toHaveStyle({ transform: "scaleX(0)" });

  act(() => jest.advanceTimersByTime(1000));
  expect(attackFill).toHaveStyle({ transform: "scaleX(1)" });
  expect(delayFill).toHaveStyle({
    animation: "battle-attack-fill 6s linear forwards"
  });

  act(() => jest.advanceTimersByTime(6000));
  expect(attackFill).toHaveStyle({
    animation: "battle-attack-fill 1s linear forwards"
  });
  expect(delayFill).toHaveStyle({ transform: "scaleX(1)" });
  expect(screen.getByText("Attack 1.0s · Delay 6.0s")).toBeInTheDocument();
  jest.useRealTimers();
});
