import { characterRepository } from "../data/characterRepository.js";
import { meetsRequiredJobForJob } from "../data/jobProgression.js";
import { findDataRecord } from "../gameData/gameData.service.js";
import type { Character } from "../types.js";
import { getAvailableStatPoints, getTotalSkillPoints } from "./characterProgressionRules.js";

export type ProgressionResult = { character: Character | null; error: string | null };

export function allocateStats(
  characterId: string,
  playerId: string,
  allocations: Character["stats"]
): ProgressionResult {
  const character = characterRepository.findById(characterId);

  if (!character || character.playerId !== playerId) return { character: null, error: "Character not found" };

  const requestedPoints = Object.values(allocations).reduce((sum, value) => sum + value, 0);
  if (requestedPoints > getAvailableStatPoints(character)) {
    return { character: null, error: "Not enough stat points" };
  }

  return {
    character: characterRepository.updateStatsForPlayer(characterId, playerId, {
      str: character.stats.str + allocations.str,
      sta: character.stats.sta + allocations.sta,
      dex: character.stats.dex + allocations.dex,
      int: character.stats.int + allocations.int
    }),
    error: null
  };
}

export function allocateSkills(
  characterId: string,
  playerId: string,
  allocations: Record<string, number>
): ProgressionResult {
  const character = characterRepository.findById(characterId);
  if (!character || character.playerId !== playerId) return { character: null, error: "Character not found" };

  const nextLevels = { ...character.skillLevels };
  let spentPoints = 0;
  for (const [skillId, level] of Object.entries(character.skillLevels)) {
    const skill = findDataRecord("skills", skillId);
    spentPoints += level * getPositiveInteger(skill?.skillPoints, 1);
  }

  let requestedPoints = 0;
  for (const [skillId, levels] of Object.entries(allocations)) {
    const skill = findDataRecord("skills", skillId);
    if (!skill) return { character: null, error: `Skill ${skillId} was not found` };

    const requiredLevel = getPositiveInteger(skill.level, 1);
    const maximumLevel = Array.isArray(skill.levels) ? Math.max(1, skill.levels.length) : 1;
    const classId = String(skill.class ?? "");
    const job = classId ? findDataRecord("jobs", classId) : null;
    if (typeof job?.name !== "string" || !meetsRequiredJobForJob(character.job, job.name)) {
      return { character: null, error: "The character's job cannot learn this skill" };
    }
    if (character.level < requiredLevel) return { character: null, error: "The required level is not met" };

    const nextLevel = (nextLevels[skillId] ?? 0) + levels;
    if (nextLevel > maximumLevel)
      return { character: null, error: "The skill is already at its maximum level" };

    for (const requirement of getRequirements(skill.requirements)) {
      if ((nextLevels[String(requirement.skill)] ?? 0) < requirement.level) {
        return { character: null, error: "A prerequisite skill level is not met" };
      }
    }

    requestedPoints += levels * getPositiveInteger(skill.skillPoints, 1);
    nextLevels[skillId] = nextLevel;
  }

  if (spentPoints + requestedPoints > getTotalSkillPoints(character)) {
    return { character: null, error: "Not enough skill points" };
  }

  return {
    character: characterRepository.updateSkillLevelsForPlayer(characterId, playerId, nextLevels),
    error: null
  };
}

function getPositiveInteger(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isInteger(value) && value > 0 ? value : fallback;
}

function getRequirements(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value.filter(
    (requirement): requirement is { level: number; skill: number } =>
      typeof requirement === "object" &&
      requirement !== null &&
      typeof requirement.level === "number" &&
      typeof requirement.skill === "number"
  );
}
