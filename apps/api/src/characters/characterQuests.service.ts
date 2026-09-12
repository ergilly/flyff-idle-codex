import { characterRepository } from "../data/characterRepository.js";
import { findDataRecord, queryDataSet, type JsonDataRecord } from "../gameData/gameData.service.js";
import type { Character } from "../types.js";
import { getQuestCompletionCheck } from "./questCompletionRules.js";

type QuestStatus = { questId: number; status: "active" | "completed" };
type QuestAcceptanceError = {
  status: "conflict" | "ineligible";
  error: string;
};

export type QuestAcceptanceResult =
  | { character: Character; status: "accepted" }
  | { status: "conflict" | "ineligible" | "not_found"; error: string };

export type QuestAbandonmentResult =
  | { character: Character; status: "abandoned" }
  | { status: "not_found"; error: string };

export type QuestCompletionResult =
  | { character: Character; experienceGain: number; status: "completed" }
  | { status: "incomplete" | "not_found" | "unsupported"; error: string };

export function acceptCharacterQuest(
  characterId: string,
  playerId: string,
  questId: number,
  npcId: number
): QuestAcceptanceResult {
  const character = characterRepository.findById(characterId);

  if (!character || character.playerId !== playerId) {
    return { status: "not_found", error: "Character not found" };
  }

  const quest = findDataRecord("quests", String(questId));

  if (!quest) {
    return { status: "not_found", error: "Quest not found" };
  }

  const statuses = characterRepository.getStatuses(characterId);
  const eligibilityError = getQuestAcceptanceError(character, quest, statuses, npcId);

  if (eligibilityError) {
    return eligibilityError;
  }

  const updatedCharacter = characterRepository.acceptForPlayer(characterId, playerId, questId);
  return updatedCharacter
    ? { status: "accepted", character: updatedCharacter }
    : { status: "not_found", error: "Character not found" };
}

export function abandonCharacterQuest(
  characterId: string,
  playerId: string,
  questId: number
): QuestAbandonmentResult {
  const character = characterRepository.findById(characterId);

  if (!character || character.playerId !== playerId) {
    return { status: "not_found", error: "Character not found" };
  }

  const abandonmentError = getQuestAbandonmentError(characterRepository.getStatuses(characterId), questId);
  if (abandonmentError) return { status: "not_found", error: abandonmentError };

  const updatedCharacter = characterRepository.abandonForPlayer(characterId, playerId, questId);
  return updatedCharacter
    ? { status: "abandoned", character: updatedCharacter }
    : { status: "not_found", error: "Active quest not found" };
}

export function completeCharacterQuest(
  characterId: string,
  playerId: string,
  questId: number,
  npcId: number
): QuestCompletionResult {
  const character = characterRepository.findById(characterId);

  if (!character || character.playerId !== playerId) {
    return { status: "not_found", error: "Character not found" };
  }

  const quest = findDataRecord("quests", String(questId));
  if (!quest) return { status: "not_found", error: "Quest not found" };

  const abandonmentError = getQuestAbandonmentError(characterRepository.getStatuses(characterId), questId);
  if (abandonmentError) return { status: "not_found", error: abandonmentError };

  const completionCheck = getQuestCompletionCheck(character, quest, npcId);
  if (completionCheck.status !== "ready") return completionCheck;

  const completed = characterRepository.completeForPlayer(
    characterId,
    playerId,
    questId,
    completionCheck.plan
  );

  return completed.character
    ? { status: "completed", character: completed.character, experienceGain: completed.experienceGain }
    : { status: "incomplete", error: completed.error ?? "Unable to complete quest" };
}

export function getQuestAbandonmentError(statuses: QuestStatus[], questId: number) {
  return statuses.some((entry) => entry.questId === questId && entry.status === "active")
    ? null
    : "Active quest not found";
}

export function getQuestAcceptanceError(
  character: Pick<Character, "job" | "level">,
  quest: JsonDataRecord,
  statuses: QuestStatus[],
  npcId: number
): QuestAcceptanceError | null {
  if (quest.beginNPC !== npcId) {
    return { status: "ineligible", error: "This NPC does not offer that quest" };
  }

  if (statuses.some((entry) => entry.questId === quest.id && entry.status === "active")) {
    return { status: "conflict", error: "Quest is already active" };
  }
  if (
    quest.repeatable !== true &&
    statuses.some((entry) => entry.questId === quest.id && entry.status === "completed")
  ) {
    return { status: "conflict", error: "Quest has already been completed" };
  }

  const minimumLevel = typeof quest.minLevel === "number" ? quest.minLevel : 1;
  const maximumLevel = typeof quest.maxLevel === "number" ? quest.maxLevel : Number.MAX_SAFE_INTEGER;

  if (character.level < minimumLevel || character.level > maximumLevel) {
    return { status: "ineligible", error: `Quest requires level ${minimumLevel}–${maximumLevel}` };
  }

  if (Array.isArray(quest.beginClasses) && quest.beginClasses.length > 0) {
    const jobId = queryDataSet("jobs", { name: character.job, fields: "id", limit: 1 }).results[0]?.id;

    if (!quest.beginClasses.some((classId) => String(classId) === String(jobId))) {
      return { status: "ineligible", error: "Character class cannot accept this quest" };
    }
  }

  const statusByQuestId = new Map(statuses.map((entry) => [entry.questId, entry.status]));
  const prerequisites = Array.isArray(quest.beginQuests) ? quest.beginQuests : [];

  for (const prerequisite of prerequisites) {
    if (!isRecord(prerequisite) || typeof prerequisite.quest !== "number") continue;
    const isCompleted = statusByQuestId.get(prerequisite.quest) === "completed";

    if (prerequisite.completed === true && !isCompleted) {
      return { status: "ineligible", error: "A prerequisite quest has not been completed" };
    }
    if (prerequisite.completed === false && isCompleted) {
      return { status: "ineligible", error: "A conflicting prerequisite quest was completed" };
    }
  }

  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
