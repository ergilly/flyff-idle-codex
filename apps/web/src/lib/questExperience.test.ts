import {
  formatQuestExperiencePercentage,
  getQuestExperiencePercentage,
  getQuestExperienceReward
} from "./questExperience";

describe("quest experience rewards", () => {
  const percentages = Array.from({ length: 30 }, () => 0);
  percentages[22] = 35;
  percentages[23] = 26.7463;

  it("reads the percentage for the character's current level", () => {
    expect(getQuestExperiencePercentage(percentages, 23)).toBe(35);
    expect(getQuestExperiencePercentage(percentages, 24)).toBe(26.7463);
    expect(getQuestExperiencePercentage(percentages, 200)).toBe(0);
  });

  it("converts the current-level percentage into flat experience", () => {
    expect(getQuestExperienceReward(percentages, { level: 23, progressionRank: "normal" })).toEqual({
      experience: 3633,
      percentage: 35
    });
    expect(getQuestExperienceReward(percentages, { level: 24, progressionRank: "normal" })).toEqual({
      experience: 3490,
      percentage: 26.7463
    });
  });

  it("formats imported percentage precision without trailing zeroes", () => {
    expect(formatQuestExperiencePercentage(35)).toBe("35");
    expect(formatQuestExperiencePercentage(26.7463)).toBe("26.7463");
  });
});
