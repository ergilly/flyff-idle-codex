import type { CharacterProgressionRank } from "@/lib/characterProgression";
import { getExpRequiredForNextLevel } from "@/lib/characterProgression";

type QuestRewardCharacter = {
  level: number;
  progressionRank: CharacterProgressionRank;
};

export type QuestExperienceReward = {
  experience: number;
  percentage: number;
};

export function getQuestExperiencePercentage(percentages: number[] | undefined, level: number) {
  const percentage = percentages?.[Math.max(0, Math.floor(level) - 1)];
  return typeof percentage === "number" && Number.isFinite(percentage) && percentage > 0 ? percentage : 0;
}

export function getQuestExperienceReward(
  percentages: number[] | undefined,
  character: QuestRewardCharacter
): QuestExperienceReward {
  const percentage = getQuestExperiencePercentage(percentages, character.level);
  const requiredExperience = getExpRequiredForNextLevel(character);
  const experience = requiredExperience
    ? Math.max(0, Math.floor((requiredExperience * percentage) / 100))
    : 0;

  return { experience, percentage };
}

export function formatQuestExperiencePercentage(percentage: number) {
  return Number(percentage.toFixed(4)).toString();
}
