import type { Character, CharacterSkillLevels } from "@/lib/api";
import { cx } from "@/lib/classNames";
import type { SkillDefinition, SkillRequirement } from "@/lib/skillTrees";
import { getTestIdSegment } from "@/lib/testIds";

function isSkillRequirementMet(skillLevels: CharacterSkillLevels, requirement: SkillRequirement) {
  return (skillLevels[requirement.skill] ?? 0) >= requirement.level;
}

export function SkillRequirements({
  character,
  className,
  skill,
  skillLevels
}: {
  character: Character;
  className?: string;
  skill: SkillDefinition;
  skillLevels: CharacterSkillLevels;
}) {
  const isLevelMet = character.level >= skill.requiredLevel;

  return (
    <span
      className={cx("grid gap-1 text-xs font-bold", className)}
      data-testid={`character_skills_span_requirements_${getTestIdSegment(skill.id)}`}
    >
      <span
        className="text-[0.68rem] font-black uppercase tracking-[0.08em] text-text-muted"
        data-testid={`character_skills_span_requirements_label_${getTestIdSegment(skill.id)}`}
      >
        Requirements
      </span>
      <span
        className={cx(isLevelMet ? "text-[#54d978]" : "text-[#ff5a58]")}
        data-testid={`character_skills_span_requirement_level_${getTestIdSegment(skill.id)}`}
      >
        Level {skill.requiredLevel}
      </span>
      {skill.requirements.map((requirement) => {
        const requirementMet = isSkillRequirementMet(skillLevels, requirement);

        return (
          <span
            className={cx(requirementMet ? "text-[#54d978]" : "text-[#ff5a58]")}
            data-testid={`character_skills_span_requirement_${getTestIdSegment(skill.id)}_${getTestIdSegment(requirement.skill)}`}
            key={`${skill.id}-${requirement.skill}`}
          >
            {requirement.skillName} Lv. {requirement.level}
          </span>
        );
      })}
    </span>
  );
}
