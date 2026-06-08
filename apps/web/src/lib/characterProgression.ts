import type { Character } from "@/lib/api";

export type CharacterProgressionRank = "normal" | "master" | "hero";

type SkillPointRange = {
  end: number;
  pointsPerLevel: number;
  start: number;
};

const skillPointRanges: SkillPointRange[] = [
  { start: 2, end: 20, pointsPerLevel: 2 },
  { start: 21, end: 40, pointsPerLevel: 3 },
  { start: 41, end: 60, pointsPerLevel: 4 },
  { start: 61, end: 80, pointsPerLevel: 5 },
  { start: 81, end: 100, pointsPerLevel: 6 },
  { start: 101, end: 120, pointsPerLevel: 7 },
  { start: 121, end: 140, pointsPerLevel: 8 },
  { start: 141, end: 150, pointsPerLevel: 1 },
  { start: 151, end: 165, pointsPerLevel: 2 },
  { start: 166, end: 190, pointsPerLevel: 10 }
];

const firstJobSkillPointBonus: Record<string, number> = {
  Acrobat: 50,
  Assist: 60,
  Magician: 90,
  Mercenary: 60
};

const secondJobSkillPointBonus: Record<string, number> = {
  Jester: 100,
  Ranger: 100,
  Billposter: 120,
  Ringmaster: 100,
  Elementor: 300,
  Psykeeper: 90,
  Blade: 80,
  Knight: 80
};

const thirdJobSkillPointBonus: Record<string, number> = {
  Harlequin: 100,
  Crackshooter: 150,
  Forcemaster: 300,
  Seraph: 300,
  Arcanist: 300,
  Mentalist: 210,
  Slayer: 150,
  Templar: 50
};

const secondJobToFirstJob: Record<string, string> = {
  Blade: "Mercenary",
  Knight: "Mercenary",
  Elementor: "Magician",
  Psykeeper: "Magician",
  Billposter: "Assist",
  Ringmaster: "Assist",
  Jester: "Acrobat",
  Ranger: "Acrobat"
};

const thirdJobToSecondJob: Record<string, string> = {
  Slayer: "Blade",
  Templar: "Knight",
  Arcanist: "Elementor",
  Mentalist: "Psykeeper",
  Forcemaster: "Billposter",
  Seraph: "Ringmaster",
  Harlequin: "Jester",
  Crackshooter: "Ranger"
};

const baseStatTotal = 60;
const normalStatPointCap = 2 * (120 - 1);
const masterStatPointCap = 3 * (120 - 59);

function clampLevel(level: number, min: number, max: number) {
  return Math.min(max, Math.max(min, level));
}

function getFirstJob(job: string) {
  const secondJob = thirdJobToSecondJob[job];

  if (firstJobSkillPointBonus[job]) {
    return job;
  }

  return secondJobToFirstJob[job] ?? (secondJob ? secondJobToFirstJob[secondJob] : undefined);
}

function getSecondJob(job: string) {
  return thirdJobToSecondJob[job] ?? (secondJobSkillPointBonus[job] ? job : undefined);
}

function getThirdJob(job: string) {
  return thirdJobSkillPointBonus[job] ? job : undefined;
}

export function getProgressionRank(character: Pick<Character, "progressionRank">) {
  return character.progressionRank ?? "normal";
}

export function getEffectiveSkillLevel(character: Pick<Character, "level" | "progressionRank">) {
  const rank = getProgressionRank(character);

  if (rank === "master") {
    return clampLevel(character.level, 60, 120) + 61;
  }

  if (rank === "hero") {
    return clampLevel(character.level, 121, 130) + 60;
  }

  return clampLevel(character.level, 1, 120);
}

export function getSkillPointsFromLevels(effectiveLevel: number) {
  return skillPointRanges.reduce((totalPoints, range) => {
    const levelsInRange = clampLevel(effectiveLevel, range.start - 1, range.end) - (range.start - 1);

    return totalPoints + levelsInRange * range.pointsPerLevel;
  }, 0);
}

export function getSkillPointBonus(character: Pick<Character, "job" | "level" | "progressionRank">) {
  const rank = getProgressionRank(character);
  const firstJob = getFirstJob(character.job);
  const secondJob = getSecondJob(character.job);
  const thirdJob = getThirdJob(character.job);
  let bonus = 0;

  if (firstJob && (rank !== "normal" || character.level >= 15)) {
    bonus += firstJobSkillPointBonus[firstJob] ?? 0;
  }

  if (secondJob && (rank !== "normal" || character.level >= 60)) {
    bonus += secondJobSkillPointBonus[secondJob] ?? 0;
  }

  if (thirdJob && rank === "hero" && character.level >= 130) {
    bonus += thirdJobSkillPointBonus[thirdJob] ?? 0;
  }

  return bonus;
}

export function getTotalSkillPoints(character: Pick<Character, "job" | "level" | "progressionRank">) {
  return getSkillPointsFromLevels(getEffectiveSkillLevel(character)) + getSkillPointBonus(character);
}

export function getTotalStatPoints(character: Pick<Character, "level" | "progressionRank">) {
  const rank = getProgressionRank(character);

  if (rank === "master") {
    return normalStatPointCap + 3 * (clampLevel(character.level, 60, 120) - 59);
  }

  if (rank === "hero") {
    return normalStatPointCap + masterStatPointCap + 3 * (clampLevel(character.level, 121, 130) - 120);
  }

  return 2 * (clampLevel(character.level, 1, 120) - 1);
}

export function getSpentStatPoints(character: Pick<Character, "stats">) {
  return Object.values(character.stats).reduce((totalStats, stat) => totalStats + stat, 0) - baseStatTotal;
}

export function getAvailableStatPoints(character: Pick<Character, "level" | "progressionRank" | "stats">) {
  return Math.max(0, getTotalStatPoints(character) - getSpentStatPoints(character));
}

export const skillLevelRules = {
  vagrant: { costPerLevel: 1, maxLevel: 10 },
  firstJob: { costPerLevel: 2, maxLevel: 20 },
  secondJob: { costPerLevel: 3, maxLevel: 10 },
  thirdJob: { costPerLevel: 4, maxLevel: 5 },
  masterSkillLevels: [60, 72, 84, 96, 108],
  heroSkillLevel: 121
} as const;
