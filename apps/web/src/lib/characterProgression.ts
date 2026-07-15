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
const expTableByLevel = new Map<number, number>([
  [1, 0],
  [2, 14],
  [3, 20],
  [4, 36],
  [5, 90],
  [6, 152],
  [7, 250],
  [8, 352],
  [9, 480],
  [10, 591],
  [11, 743],
  [12, 973],
  [13, 1290],
  [14, 1632],
  [15, 1928],
  [16, 2340],
  [17, 3480],
  [18, 4125],
  [19, 4995],
  [20, 5880],
  [21, 7840],
  [22, 6875],
  [23, 8243],
  [24, 10380],
  [25, 13052],
  [26, 16450],
  [27, 20700],
  [28, 26143],
  [29, 31950],
  [30, 38640],
  [31, 57035],
  [32, 65000],
  [33, 69125],
  [34, 72000],
  [35, 87239],
  [36, 105863],
  [37, 128694],
  [38, 182307],
  [39, 221450],
  [40, 269042],
  [41, 390368],
  [42, 438550],
  [43, 458137],
  [44, 468943],
  [45, 560177],
  [46, 669320],
  [47, 799963],
  [48, 1115396],
  [49, 1331100],
  [50, 1590273],
  [51, 2306878],
  [52, 2594255],
  [53, 2711490],
  [54, 2777349],
  [55, 3318059],
  [56, 3963400],
  [57, 4735913],
  [58, 6600425],
  [59, 7886110],
  [60, 9421875],
  [61, 13547310],
  [62, 15099446],
  [63, 15644776],
  [64, 15885934],
  [65, 18817757],
  [66, 22280630],
  [67, 26392968],
  [68, 36465972],
  [69, 43184958],
  [70, 51141217],
  [71, 73556918],
  [72, 81991117],
  [73, 84966758],
  [74, 86252845],
  [75, 102171368],
  [76, 120995493],
  [77, 143307208],
  [78, 198000645],
  [79, 234477760],
  [80, 277716683],
  [81, 381795797],
  [82, 406848219],
  [83, 403044458],
  [84, 391191019],
  [85, 442876559],
  [86, 501408635],
  [87, 567694433],
  [88, 749813704],
  [89, 849001357],
  [90, 961154774],
  [91, 1309582668],
  [92, 1382799035],
  [93, 1357505030],
  [94, 1305632790],
  [95, 1464862605],
  [96, 1628695740],
  [97, 1810772333],
  [98, 2348583653],
  [99, 2611145432],
  [100, 2903009208],
  [101, 3919352097],
  [102, 4063358600],
  [103, 3916810682],
  [104, 4314535354],
  [105, 4752892146],
  [106, 5235785988],
  [107, 5767741845],
  [108, 6353744416],
  [109, 6999284849],
  [110, 7710412189],
  [111, 8493790068],
  [112, 9356759139],
  [113, 10307405867],
  [114, 11354638303],
  [115, 12508269555],
  [116, 13779109742],
  [117, 15179067292],
  [118, 16721260528],
  [119, 18420140598],
  [120, 20291626883],
  [121, 22353256174],
  [122, 24624347002],
  [123, 27126180657],
  [124, 29882200612],
  [125, 32918232194],
  [126, 36262724585],
  [127, 39947017402],
  [128, 44005634371],
  [129, 48476606823],
  [130, 53401830076],
  [131, 58827456011],
  [132, 64804325542],
  [133, 71388445017],
  [134, 78641511031],
  [135, 86631488552],
  [136, 95433247789],
  [137, 105129265764],
  [138, 115810399166],
  [139, 127576735721],
  [140, 140538532070],
  [141, 154817246928],
  [142, 170546679216],
  [143, 187874221825],
  [144, 206962242762],
  [145, 227989606627],
  [146, 251153350660],
  [147, 276670531087],
  [148, 304780257046],
  [149, 335745931162],
  [150, 369857717768],
  [151, 554786576652],
  [152, 832179864978],
  [153, 1248269797467],
  [154, 1872404696201],
  [155, 2808607044301],
  [156, 3089467748731],
  [157, 3182151781193],
  [158, 3277616334629],
  [159, 3375944824668],
  [160, 3477223169408],
  [161, 3581539864490],
  [162, 3688986060425],
  [163, 3799655642237],
  [164, 3913645311505],
  [165, 4031054670850],
  [166, 4151986310975],
  [167, 5812780835365],
  [168, 7556615085975],
  [169, 9823599611767],
  [170, 12770679495297]
]);

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

export function getMaxLevelForProgressionRank(rank: CharacterProgressionRank) {
  if (rank === "hero") {
    return 170;
  }

  return 120;
}

export function getExpRequiredForLevel(level: number) {
  return expTableByLevel.get(level) ?? null;
}

export function getExpRequiredForNextLevel(character: Pick<Character, "level" | "progressionRank">) {
  const maxLevel = getMaxLevelForProgressionRank(getProgressionRank(character));

  if (character.level >= maxLevel) {
    return null;
  }

  return getExpRequiredForLevel(character.level + 1);
}

export function getCharacterExpProgress(character: Pick<Character, "exp" | "level" | "progressionRank">) {
  const nextLevelExp = getExpRequiredForNextLevel(character);

  return {
    currentExp: Math.max(0, character.exp),
    nextLevelExp,
    percent: nextLevelExp ? Math.min(100, Math.max(0, (character.exp / nextLevelExp) * 100)) : 100
  };
}

export function getMonsterExpReward(
  character: Pick<Character, "level" | "progressionRank">,
  monster: { experience?: number | null; level: number | null | undefined }
) {
  const monsterLevel = monster.level ?? character.level;
  const monsterExperience = monster.experience ?? 0;

  if (
    getExpRequiredForNextLevel(character) === null ||
    monsterExperience <= 0 ||
    monsterLevel > character.level + 15
  ) {
    return 0;
  }

  return Math.floor(monsterExperience);
}

export function applyExpGain(
  character: Pick<Character, "exp" | "level" | "progressionRank">,
  expGain: number
) {
  const rank = getProgressionRank(character);
  const maxLevel = getMaxLevelForProgressionRank(rank);
  let nextExp = Math.max(0, Math.floor(character.exp + expGain));
  let nextLevel = character.level;
  let nextLevelRequirement = getExpRequiredForNextLevel({ level: nextLevel, progressionRank: rank });

  while (nextLevel < maxLevel && nextLevelRequirement !== null && nextExp >= nextLevelRequirement) {
    nextExp -= nextLevelRequirement;
    nextLevel += 1;
    nextLevelRequirement = getExpRequiredForNextLevel({ level: nextLevel, progressionRank: rank });
  }

  if (nextLevel >= maxLevel) {
    nextExp = 0;
  }

  return {
    exp: nextExp,
    level: nextLevel
  };
}

export function getDeathExpPenaltyRate(level: number) {
  if (level <= 20) {
    return 0;
  }

  if (level <= 29) {
    return 0.06;
  }

  if (level <= 59) {
    return 0.05;
  }

  if (level <= 89) {
    return 0.04;
  }

  if (level <= 99) {
    return 0.03;
  }

  if (level <= 109) {
    return 0.02;
  }

  return 0.015;
}

export function applyDeathExpPenalty(character: Pick<Character, "exp" | "level" | "progressionRank">) {
  const penaltyRate = getDeathExpPenaltyRate(character.level);
  const nextLevelExp =
    getExpRequiredForNextLevel(character) ?? getExpRequiredForLevel(character.level) ?? character.exp;
  const expLoss = Math.floor(nextLevelExp * penaltyRate);

  return {
    exp: Math.max(0, character.exp - expLoss),
    expLoss,
    level: character.level
  };
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
