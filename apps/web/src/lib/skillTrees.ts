import { fetchDataSet, type Character, type CharacterSkillLevels } from "@/lib/api";

export type SkillTreeTier = "vagrant" | "first" | "second" | "third";
export type SkillCombo = "step" | "circular" | "finish" | "general";

export type SkillRequirement = {
  level: number;
  skill: string;
  skillName: string;
};

export type SkillDefinition = {
  classId: number;
  className: string;
  combo?: SkillCombo;
  costPerLevel: number;
  description: string;
  icon: string;
  id: string;
  maxLevel: number;
  name: string;
  requiredLevel: number;
  requirements: SkillRequirement[];
  tier: SkillTreeTier;
  x: number;
  y: number;
};

export type SkillTreeTab = {
  imageHeight: number;
  imageSrc: string;
  imageWidth: number;
  label: string;
  skills: SkillDefinition[];
  tier: SkillTreeTier;
};

type RawJob = {
  id: number;
  name: string;
  parent?: number;
};

type RawSkill = {
  class?: number;
  combo?: string | null;
  description?: string;
  icon: string;
  id: number;
  level: number;
  levels?: unknown[];
  name: string;
  requirements?: Array<{ level: number; skill: number }>;
  skillPoints?: number;
  treePosition?: {
    x: number;
    y: number;
  };
};

const treeImageDimensions = {
  imageWidth: 225,
  imageHeight: 135
};

const treeImages: Record<string, string> = {
  Vagrant: "/images/skills/Vagrant.png",
  Mercenary: "/images/skills/1st-job/Back_Me.png",
  Magician: "/images/skills/1st-job/Back_Ma.png",
  Assist: "/images/skills/1st-job/Back_As.png",
  Acrobat: "/images/skills/1st-job/Back_Acr.png",
  Blade: "/images/skills/2nd-job/Back_Blade.png",
  Knight: "/images/skills/2nd-job/Back_Night.png",
  Elementor: "/images/skills/2nd-job/Back_Ele.png",
  Psykeeper: "/images/skills/2nd-job/Back_Psy.png",
  Billposter: "/images/skills/2nd-job/Back_Bill.png",
  Ringmaster: "/images/skills/2nd-job/Back_Ring.png",
  Jester: "/images/skills/2nd-job/Back_Jst.png",
  Ranger: "/images/skills/2nd-job/Back_Rag.png",
  Slayer: "/images/skills/3rd-job/SkillTreeStormb.png",
  Templar: "/images/skills/3rd-job/SkillTreeLord.png",
  Arcanist: "/images/skills/3rd-job/SkillTreeElel.png",
  Mentalist: "/images/skills/3rd-job/SkillTreeMent.png",
  Forcemaster: "/images/skills/3rd-job/SkillTreeForcm.png",
  Seraph: "/images/skills/3rd-job/SkillTreeFlor.png",
  Harlequin: "/images/skills/3rd-job/SkillTreeWindI.png",
  Crackshooter: "/images/skills/3rd-job/SkillTreeCracks.png"
};

const firstJobNames = new Set(["Mercenary", "Magician", "Assist", "Acrobat"]);
const secondJobNames = new Set([
  "Blade",
  "Knight",
  "Elementor",
  "Psykeeper",
  "Billposter",
  "Ringmaster",
  "Jester",
  "Ranger"
]);
const thirdJobNames = new Set([
  "Slayer",
  "Templar",
  "Arcanist",
  "Mentalist",
  "Forcemaster",
  "Seraph",
  "Harlequin",
  "Crackshooter"
]);

const hiddenSkillNames = new Set([
  "Rending Entry",
  "Heart of Fury",
  "Grand Rage",
  "Call of Fury",
  "Heart of Sacrifice",
  "Eye of the Storm",
  "Gravity Well",
  "Moon Beam",
  "Sury's Tenacity",
  "Barrier of Life",
  "Jester's Blast",
  "Boomburst"
]);

const skillTreeLayout: Record<string, { offsetX: number; offsetY: number }> = {
  Vagrant: { offsetX: 46.5, offsetY: 51.5 },
  Mercenary: { offsetX: 21.5, offsetY: -0.5 },
  Magician: { offsetX: 21.5, offsetY: -0.5 },
  Assist: { offsetX: 4.5, offsetY: 12.5 },
  Acrobat: { offsetX: 21.5, offsetY: -0.5 },
  Blade: { offsetX: 21.5, offsetY: 25.5 },
  Knight: { offsetX: 21.5, offsetY: 25.5 },
  Elementor: { offsetX: 21.5, offsetY: -0.5 },
  Psykeeper: { offsetX: 21.5, offsetY: 25.5 },
  Billposter: { offsetX: 21.5, offsetY: 25.5 },
  Ringmaster: { offsetX: 21.5, offsetY: 25.5 },
  Jester: { offsetX: 21.5, offsetY: 25.5 },
  Ranger: { offsetX: 21.5, offsetY: 25.5 }
};

const skillPositionOverrides: Record<string, Record<string, { x: number; y: number }>> = {
  Billposter: {
    "Belial Smashing": { x: 0, y: 0 },
    "Blood Fist": { x: 50, y: 0 },
    "Piercing Serpent": { x: 100, y: 0 },
    Sonichand: { x: 150, y: 12 },
    Asmodeus: { x: 0, y: 26 },
    "Baraqijal Esna": { x: 50, y: 26 },
    "Bgvur Tialbold": { x: 100, y: 26 },
    Asalraalaikum: { x: 150, y: 52 }
  }
};

const skillPositionAdjustments: Record<string, { x?: number; y?: number }> = {
  "Geburah Tiphreth": { y: 1 },
  "Cross Strike": { y: 1 },
  "Power Swing": { y: 1 },
  "Meteo Shower": { y: 1 },
  Sandstorm: { y: 1 },
  "Lightning Storm": { y: 1 },
  Sonichand: { y: 1 },
  "Vital Stab": { y: 1 },
  "Triple Shot": { y: 1 }
};

const dependencyOrderedPositionJobs = new Set(["Ringmaster"]);

function getTier(jobName: string): SkillTreeTier {
  if (firstJobNames.has(jobName)) {
    return "first";
  }

  if (secondJobNames.has(jobName)) {
    return "second";
  }

  if (thirdJobNames.has(jobName)) {
    return "third";
  }

  return "vagrant";
}

function getSkillCombo(combo: string | null | undefined): SkillCombo {
  const normalizedCombo = combo?.toLowerCase().trim();

  if (normalizedCombo === "step" || normalizedCombo === "steps") {
    return "step";
  }

  if (normalizedCombo === "circular" || normalizedCombo === "circle") {
    return "circular";
  }

  if (normalizedCombo === "finish" || normalizedCombo === "finisher") {
    return "finish";
  }

  return "general";
}

function getTreeXCoordinate(jobName: string, position: number) {
  const layout = skillTreeLayout[jobName] ?? { offsetX: 0, offsetY: 0 };

  return ((position + layout.offsetX + 16) / treeImageDimensions.imageWidth) * 100;
}

function getTreeYCoordinate(jobName: string, position: number) {
  const layout = skillTreeLayout[jobName] ?? { offsetX: 0, offsetY: 0 };

  return ((position + layout.offsetY + 16) / treeImageDimensions.imageHeight) * 100;
}

function isDisplaySkill(skill: RawSkill, allClassSkills: RawSkill[]) {
  if (!skill.treePosition) {
    return false;
  }

  const matchingPositionSkills = allClassSkills.filter(
    (classSkill) =>
      classSkill.treePosition?.x === skill.treePosition?.x &&
      classSkill.treePosition?.y === skill.treePosition?.y
  );

  if (matchingPositionSkills.length === 1) {
    return true;
  }

  const primarySkill = matchingPositionSkills
    .filter((classSkill) => !classSkill.name.includes("("))
    .sort((first, second) => first.level - second.level || first.id - second.id)[0];

  return primarySkill?.id === skill.id;
}

function getRequirementDepth(
  skill: RawSkill,
  rowSkillsById: Map<string, RawSkill>,
  depthCache: Map<string, number>
): number {
  const skillId = String(skill.id);
  const cachedDepth = depthCache.get(skillId);

  if (cachedDepth !== undefined) {
    return cachedDepth;
  }

  const depth: number =
    Math.max(
      -1,
      ...(skill.requirements ?? [])
        .map((requirement) => rowSkillsById.get(String(requirement.skill)))
        .filter((requiredSkill): requiredSkill is RawSkill => Boolean(requiredSkill))
        .map((requiredSkill) => getRequirementDepth(requiredSkill, rowSkillsById, depthCache))
    ) + 1;

  depthCache.set(skillId, depth);
  return depth;
}

function getDependencyOrderedPositionOverrides(jobName: string, skills: RawSkill[]) {
  if (!dependencyOrderedPositionJobs.has(jobName)) {
    return {};
  }

  const skillsByRow = new Map<number, RawSkill[]>();

  skills.forEach((skill) => {
    if (!skill.treePosition) {
      return;
    }

    skillsByRow.set(skill.treePosition.y, [...(skillsByRow.get(skill.treePosition.y) ?? []), skill]);
  });

  return Object.fromEntries(
    [...skillsByRow.values()].flatMap((rowSkills) => {
      if (rowSkills.length < 2) {
        return [];
      }

      const rowSkillsById = new Map(rowSkills.map((skill) => [String(skill.id), skill]));
      const depthCache = new Map<string, number>();
      const sortedPositions = rowSkills
        .map((skill) => skill.treePosition!)
        .sort((first, second) => first.x - second.x);
      const sortedSkills = [...rowSkills].sort(
        (first, second) =>
          getRequirementDepth(first, rowSkillsById, depthCache) -
            getRequirementDepth(second, rowSkillsById, depthCache) ||
          first.treePosition!.x - second.treePosition!.x
      );

      return sortedSkills.map((skill, index) => [String(skill.id), sortedPositions[index]]);
    })
  );
}

function getSkillTreePosition(
  jobName: string,
  skill: RawSkill,
  dependencyPositionOverrides: Record<string, { x: number; y: number }>
) {
  const position =
    skillPositionOverrides[jobName]?.[skill.name] ??
    dependencyPositionOverrides[String(skill.id)] ??
    skill.treePosition;
  const adjustment = skillPositionAdjustments[skill.name];

  if (!position || !adjustment) {
    return position;
  }

  return {
    x: position.x + (adjustment.x ?? 0),
    y: position.y + (adjustment.y ?? 0)
  };
}

function getSkillsForJob(job: RawJob, classSkills: RawSkill[], skillsById: Map<string, RawSkill>) {
  if (getTier(job.name) === "third") {
    return [];
  }

  const displaySkills = classSkills
    .filter((skill) => isDisplaySkill(skill, classSkills))
    .filter((skill) => !hiddenSkillNames.has(skill.name));
  const dependencyPositionOverrides = getDependencyOrderedPositionOverrides(job.name, displaySkills);

  return displaySkills
    .sort((first, second) => {
      const firstPosition = getSkillTreePosition(job.name, first, dependencyPositionOverrides)!;
      const secondPosition = getSkillTreePosition(job.name, second, dependencyPositionOverrides)!;

      return (
        firstPosition.y - secondPosition.y || firstPosition.x - secondPosition.x || first.level - second.level
      );
    })
    .map((skill): SkillDefinition => {
      const position = getSkillTreePosition(job.name, skill, dependencyPositionOverrides)!;

      return {
        classId: job.id,
        className: job.name,
        combo: getSkillCombo(skill.combo),
        costPerLevel: skill.skillPoints ?? 1,
        description: skill.description ?? "",
        icon: skill.icon,
        id: String(skill.id),
        maxLevel: skill.levels?.length ?? 1,
        name: skill.name,
        requiredLevel: skill.level,
        requirements:
          skill.requirements?.map((requirement) => ({
            skill: String(requirement.skill),
            skillName: skillsById.get(String(requirement.skill))?.name ?? `Skill ${requirement.skill}`,
            level: requirement.level
          })) ?? [],
        tier: getTier(job.name),
        x: getTreeXCoordinate(job.name, position.x),
        y: getTreeYCoordinate(job.name, position.y)
      };
    });
}

function getJobLineage(jobName: string, jobsById: Record<string, RawJob>) {
  const lineage: RawJob[] = [];
  let job = Object.values(jobsById).find((candidate) => candidate.name === jobName);

  while (job) {
    lineage.unshift(job);
    job = job.parent ? jobsById[String(job.parent)] : undefined;
  }

  return lineage;
}

function isTierUnlocked(character: Character, tier: SkillTreeTier) {
  if (tier === "vagrant") {
    return true;
  }

  if (tier === "first") {
    return character.progressionRank !== "normal" || character.level >= 15;
  }

  if (tier === "second") {
    return character.progressionRank !== "normal" || character.level >= 60;
  }

  return character.progressionRank === "hero" && character.level >= 130;
}

export function areSkillRequirementsMet(
  character: Character,
  skillLevels: CharacterSkillLevels,
  skill: SkillDefinition
) {
  return (
    character.level >= skill.requiredLevel &&
    skill.requirements.every((requirement) => (skillLevels[requirement.skill] ?? 0) >= requirement.level)
  );
}

export function canRemovePendingSkillLevel(
  character: Character,
  pendingSkillLevels: CharacterSkillLevels,
  skillTabs: SkillTreeTab[],
  skill: SkillDefinition
) {
  if ((pendingSkillLevels[skill.id] ?? 0) <= 0) {
    return false;
  }

  const nextSkillLevels = { ...character.skillLevels };

  Object.entries(pendingSkillLevels).forEach(([skillId, level]) => {
    nextSkillLevels[skillId] = (nextSkillLevels[skillId] ?? 0) + level;
  });

  nextSkillLevels[skill.id] = Math.max(0, (nextSkillLevels[skill.id] ?? 0) - 1);

  return getUnlockedSkills(skillTabs)
    .filter((candidateSkill) => candidateSkill.id !== skill.id)
    .filter((candidateSkill) => (nextSkillLevels[candidateSkill.id] ?? 0) > 0)
    .every((candidateSkill) =>
      candidateSkill.requirements.every(
        (requirement) =>
          requirement.skill !== skill.id || (nextSkillLevels[skill.id] ?? 0) >= requirement.level
      )
    );
}

export async function fetchUnlockedSkillTabs(character: Character) {
  const jobs = await fetchDataSet<RawJob>("jobs", { limit: 500 });
  const jobsById = Object.fromEntries(jobs.map((job) => [String(job.id), job]));
  const lineage = getJobLineage(character.job, jobsById).filter((job) => treeImages[job.name]);
  const classSkillEntries = await Promise.all(
    lineage.map(
      async (job): Promise<[number, RawSkill[]]> => [
        job.id,
        await fetchDataSet<RawSkill>("skills", { classId: job.id, limit: 500 })
      ]
    )
  );
  const classSkillsByJobId = new Map(classSkillEntries);
  const skillsById = new Map(
    [...classSkillsByJobId.values()].flat().map((skill) => [String(skill.id), skill])
  );
  const skillTabs = lineage.map((job) => {
    const classSkills = classSkillsByJobId.get(job.id) ?? [];

    return {
      tier: getTier(job.name),
      label: job.name,
      imageSrc: treeImages[job.name],
      skills: getSkillsForJob(job, classSkills, skillsById),
      ...treeImageDimensions
    };
  });

  return skillTabs.filter((tab) => isTierUnlocked(character, tab.tier));
}

export function getUnlockedSkills(skillTabs: SkillTreeTab[]) {
  return skillTabs.flatMap((tab) => tab.skills);
}

export function getSpentSkillPointsForSkills(
  skillsToPrice: SkillDefinition[],
  skillLevels: CharacterSkillLevels
) {
  const skillsById = new Map(skillsToPrice.map((skill) => [skill.id, skill]));

  return Object.entries(skillLevels).reduce((totalPoints, [skillId, level]) => {
    const skill = skillsById.get(skillId);

    if (!skill) {
      return totalPoints;
    }

    return totalPoints + Math.min(level, skill.maxLevel) * skill.costPerLevel;
  }, 0);
}
