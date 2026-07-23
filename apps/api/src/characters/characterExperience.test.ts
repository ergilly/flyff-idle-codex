import { applyCharacterExperience, getQuestExperienceGain } from "./characterExperience.js";
import type { Character } from "../types.js";

const character = { exp: 0, level: 23, progressionRank: "normal" } as Character;

describe("character quest experience", () => {
  it("uses the quest percentage at the character's current level", () => {
    const percentages = Array.from({ length: 24 }, () => 0);
    percentages[22] = 35;
    percentages[23] = 26.7463;

    expect(getQuestExperienceGain(percentages, character)).toBe(3633);
    expect(getQuestExperienceGain(percentages, { ...character, level: 24 })).toBe(3490);
  });

  it("applies quest experience across level boundaries", () => {
    expect(applyCharacterExperience({ ...character, exp: 10_000 }, 1_000)).toEqual({
      exp: 620,
      level: 24
    });
  });
});
