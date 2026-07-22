import { getAvailableStatPoints, getTotalSkillPoints } from "./characterProgressionRules.js";

describe("character progression rules", () => {
  it("calculates available stat points from level, rank, and spent stats", () => {
    expect(
      getAvailableStatPoints({
        level: 2,
        progressionRank: "normal",
        stats: { str: 15, sta: 15, dex: 15, int: 15 }
      })
    ).toBe(2);
    expect(
      getAvailableStatPoints({
        level: 2,
        progressionRank: "normal",
        stats: { str: 17, sta: 15, dex: 15, int: 15 }
      })
    ).toBe(0);
  });

  it("includes level and job bonuses in total skill points", () => {
    expect(getTotalSkillPoints({ job: "Vagrant", level: 1, progressionRank: "normal" })).toBe(0);
    expect(getTotalSkillPoints({ job: "Mercenary", level: 15, progressionRank: "normal" })).toBe(88);
  });
});
