import {
  getAvailableStatPoints,
  applyDeathExpPenalty,
  applyExpGain,
  getCharacterExpProgress,
  getDeathExpPenaltyRate,
  getEffectiveSkillLevel,
  getExpRequiredForNextLevel,
  getMonsterExpReward,
  getSkillPointBonus,
  getSkillPointsFromLevels,
  getTotalSkillPoints,
  getTotalStatPoints,
  skillLevelRules
} from "@/lib/characterProgression";
import type { Character } from "@/lib/api";

function character(overrides: Partial<Character>): Character {
  return {
    id: "character-1",
    slotIndex: 0,
    name: "Test",
    gender: "male",
    job: "Vagrant",
    progressionRank: "normal",
    level: 1,
    exp: 0,
    penya: 0,
    stats: {
      str: 15,
      sta: 15,
      dex: 15,
      int: 15
    },
    skillLevels: {},
    equipment: {
      helmet: null,
      suit: null,
      gloves: null,
      boots: null,
      flying: null,
      csBoots: null,
      csGloves: null,
      csSuit: null,
      csHelm: null,
      mask: null,
      cloak: null,
      ammo: null,
      offhand: null,
      mainhand: null,
      ringR: null,
      earringR: null,
      necklace: null,
      earringL: null,
      ringL: null
    },
    inventory: {
      size: 50,
      items: []
    },
    ...overrides
  };
}

describe("character progression", () => {
  it("calculates skill points from the published level table", () => {
    expect(getSkillPointsFromLevels(1)).toBe(0);
    expect(getSkillPointsFromLevels(20)).toBe(38);
    expect(getSkillPointsFromLevels(40)).toBe(98);
    expect(getSkillPointsFromLevels(120)).toBe(538);
    expect(getSkillPointsFromLevels(190)).toBe(988);
  });

  it("maps normal, master, and hero characters onto the skill point table", () => {
    expect(getEffectiveSkillLevel(character({ level: 120 }))).toBe(120);
    expect(getEffectiveSkillLevel(character({ progressionRank: "master", level: 60 }))).toBe(121);
    expect(getEffectiveSkillLevel(character({ progressionRank: "master", level: 120 }))).toBe(181);
    expect(getEffectiveSkillLevel(character({ progressionRank: "hero", level: 130 }))).toBe(190);
  });

  it("adds job change skill point bonuses for the unlocked class lineage", () => {
    expect(getSkillPointBonus(character({ job: "Mercenary", level: 15 }))).toBe(60);
    expect(getSkillPointBonus(character({ job: "Blade", level: 60 }))).toBe(140);
    expect(getSkillPointBonus(character({ job: "Slayer", progressionRank: "hero", level: 130 }))).toBe(290);
  });

  it("calculates stat points across normal, master, and hero progression", () => {
    expect(getTotalStatPoints(character({ level: 1 }))).toBe(0);
    expect(getTotalStatPoints(character({ level: 120 }))).toBe(238);
    expect(getTotalStatPoints(character({ progressionRank: "master", level: 60 }))).toBe(241);
    expect(getTotalStatPoints(character({ progressionRank: "master", level: 120 }))).toBe(421);
    expect(getTotalStatPoints(character({ progressionRank: "hero", level: 130 }))).toBe(451);
  });

  it("subtracts stat points already assigned above the starting stats", () => {
    expect(
      getAvailableStatPoints(
        character({
          level: 15,
          stats: {
            str: 20,
            sta: 15,
            dex: 15,
            int: 15
          }
        })
      )
    ).toBe(23);
  });

  it("keeps skill-level cost rules explicit", () => {
    expect(skillLevelRules).toEqual({
      vagrant: { costPerLevel: 1, maxLevel: 10 },
      firstJob: { costPerLevel: 2, maxLevel: 20 },
      secondJob: { costPerLevel: 3, maxLevel: 10 },
      thirdJob: { costPerLevel: 4, maxLevel: 5 },
      masterSkillLevels: [60, 72, 84, 96, 108],
      heroSkillLevel: 121
    });
  });

  it("combines level skill points and job bonuses", () => {
    expect(getTotalSkillPoints(character({ job: "Mercenary", level: 15 }))).toBe(88);
    expect(getTotalSkillPoints(character({ job: "Slayer", progressionRank: "hero", level: 130 }))).toBe(1278);
  });

  it("uses the pasted Flyff EXP table for next-level progress", () => {
    expect(getExpRequiredForNextLevel(character({ level: 1 }))).toBe(14);
    expect(getExpRequiredForNextLevel(character({ level: 65 }))).toBe(22280630);
    expect(getExpRequiredForNextLevel(character({ progressionRank: "master", level: 120 }))).toBeNull();
    expect(getExpRequiredForNextLevel(character({ progressionRank: "hero", level: 169 }))).toBe(
      12770679495297
    );
    expect(getCharacterExpProgress(character({ level: 2, exp: 7 })).percent).toBe(35);
  });

  it("awards monster EXP from the monster's flat EXP value", () => {
    expect(getMonsterExpReward(character({ level: 65 }), { experience: 250, level: 65 })).toBe(250);
    expect(getMonsterExpReward(character({ level: 65 }), { experience: 1500, level: 66 })).toBe(1500);
    expect(getMonsterExpReward(character({ level: 65 }), { experience: null, level: 65 })).toBe(0);
    expect(getMonsterExpReward(character({ level: 65 }), { experience: 1000, level: 81 })).toBe(0);
    expect(getMonsterExpReward(character({ level: 65 }), { experience: 1000, level: 80 })).toBe(1000);
  });

  it("levels up from current-level EXP and carries overflow", () => {
    expect(applyExpGain(character({ level: 1, exp: 10 }), 10)).toEqual({ level: 2, exp: 6 });
    expect(applyExpGain(character({ level: 119, exp: 20291626882 }), 1)).toEqual({
      level: 120,
      exp: 0
    });
  });

  it("applies death EXP penalties by character level range", () => {
    expect(getDeathExpPenaltyRate(20)).toBe(0);
    expect(getDeathExpPenaltyRate(21)).toBe(0.06);
    expect(getDeathExpPenaltyRate(30)).toBe(0.05);
    expect(getDeathExpPenaltyRate(60)).toBe(0.04);
    expect(getDeathExpPenaltyRate(90)).toBe(0.03);
    expect(getDeathExpPenaltyRate(100)).toBe(0.02);
    expect(getDeathExpPenaltyRate(110)).toBe(0.015);
    expect(applyDeathExpPenalty(character({ level: 21, exp: 1000 }))).toEqual({
      exp: 588,
      expLoss: 412,
      level: 21
    });
  });

  it("carries death EXP loss into 99.99 percent of the previous level", () => {
    const result = applyDeathExpPenalty(character({ level: 21, exp: 100 }));
    const previousLevelRequirement = getExpRequiredForNextLevel(
      character({ level: 20, progressionRank: "normal" })
    );
    const previousLevelExp = Math.floor((previousLevelRequirement ?? 0) * 0.9999);

    expect(result).toEqual({
      exp: previousLevelExp - (result.expLoss - 100),
      expLoss: 412,
      level: 20
    });
  });

  it("does not lose a level when the penalty lands exactly at zero EXP", () => {
    expect(applyDeathExpPenalty(character({ level: 21, exp: 412 }))).toEqual({
      exp: 0,
      expLoss: 412,
      level: 21
    });
  });
});
