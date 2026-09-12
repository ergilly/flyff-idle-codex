import type { Character } from "../types.js";

type SkillPointRange = { end: number; pointsPerLevel: number; start: number };

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
  Billposter: 120,
  Blade: 80,
  Elementor: 300,
  Jester: 100,
  Knight: 80,
  Psykeeper: 90,
  Ranger: 100,
  Ringmaster: 100
};
const thirdJobSkillPointBonus: Record<string, number> = {
  Arcanist: 300,
  Crackshooter: 150,
  Forcemaster: 300,
  Harlequin: 100,
  Mentalist: 210,
  Seraph: 300,
  Slayer: 150,
  Templar: 50
};
const firstJobByJob: Record<string, string> = {
  Acrobat: "Acrobat",
  Assist: "Assist",
  Magician: "Magician",
  Mercenary: "Mercenary",
  Billposter: "Assist",
  Ringmaster: "Assist",
  Elementor: "Magician",
  Psykeeper: "Magician",
  Blade: "Mercenary",
  Knight: "Mercenary",
  Jester: "Acrobat",
  Ranger: "Acrobat"
};
const secondJobByJob: Record<string, string> = {
  Arcanist: "Elementor",
  Crackshooter: "Ranger",
  Forcemaster: "Billposter",
  Harlequin: "Jester",
  Mentalist: "Psykeeper",
  Seraph: "Ringmaster",
  Slayer: "Blade",
  Templar: "Knight"
};

const baseStatTotal = 60;
const normalStatPointCap = 2 * (120 - 1);
const masterStatPointCap = 3 * (120 - 59);

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

export function getAvailableStatPoints(character: Pick<Character, "level" | "progressionRank" | "stats">) {
  const total =
    character.progressionRank === "master"
      ? normalStatPointCap + 3 * (clamp(character.level, 60, 120) - 59)
      : character.progressionRank === "hero"
        ? normalStatPointCap + masterStatPointCap + 3 * (clamp(character.level, 121, 130) - 120)
        : 2 * (clamp(character.level, 1, 120) - 1);
  const spent = Object.values(character.stats).reduce((sum, value) => sum + value, 0) - baseStatTotal;

  return Math.max(0, total - spent);
}

export function getTotalSkillPoints(character: Pick<Character, "job" | "level" | "progressionRank">) {
  const effectiveLevel =
    character.progressionRank === "master"
      ? clamp(character.level, 60, 120) + 61
      : character.progressionRank === "hero"
        ? clamp(character.level, 121, 130) + 60
        : clamp(character.level, 1, 120);
  const levelPoints = skillPointRanges.reduce(
    (sum, range) =>
      sum + (clamp(effectiveLevel, range.start - 1, range.end) - (range.start - 1)) * range.pointsPerLevel,
    0
  );
  const firstJob = firstJobByJob[character.job] ?? firstJobByJob[secondJobByJob[character.job]];
  const secondJob =
    secondJobByJob[character.job] ?? (secondJobSkillPointBonus[character.job] ? character.job : undefined);
  const firstBonus =
    firstJob && (character.progressionRank !== "normal" || character.level >= 15)
      ? (firstJobSkillPointBonus[firstJob] ?? 0)
      : 0;
  const secondBonus =
    secondJob && (character.progressionRank !== "normal" || character.level >= 60)
      ? (secondJobSkillPointBonus[secondJob] ?? 0)
      : 0;
  const thirdBonus =
    character.progressionRank === "hero" && character.level >= 130
      ? (thirdJobSkillPointBonus[character.job] ?? 0)
      : 0;

  return levelPoints + firstBonus + secondBonus + thirdBonus;
}
