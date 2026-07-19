import { getMonsterAttackDelaySeconds, getMonsterAttackTiming } from "./monsterAttackTiming";
import { buildMonster } from "@/test/fixtures";

it("uses the monster attack delay", () => {
  expect(getMonsterAttackDelaySeconds(buildMonster({ attackDelay: 6 }))).toBe(6);
});

it("returns both phases of the monster attack cycle", () => {
  expect(getMonsterAttackTiming(buildMonster({ attackSpeed: 1.3, attackDelay: 5 }))).toEqual({
    attackDelaySeconds: 5,
    attackSpeedSeconds: 1.3
  });
});

it("preserves the legacy delay when monster timing data is unavailable", () => {
  expect(getMonsterAttackDelaySeconds(null)).toBe(2.4);
});
