import Image from "next/image";
import type { Character, CharacterSkillLevels } from "@/lib/api";
import { getSkillIconUrl } from "@/lib/api";
import { cx } from "@/lib/classNames";
import { areSkillRequirementsMet, type SkillDefinition } from "@/lib/skillTrees";
import { getTestIdSegment } from "@/lib/testIds";
import { SkillRequirements } from "./SkillRequirements";

type SkillTreeNodeProps = {
  appliedLevel: number;
  character: Character;
  displayedSkillLevels: CharacterSkillLevels;
  isSelected: boolean;
  level: number;
  onSelect: () => void;
  pendingLevel: number;
  skill: SkillDefinition;
};

export function SkillTreeNode({
  appliedLevel,
  character,
  displayedSkillLevels,
  isSelected,
  level,
  onSelect,
  pendingLevel,
  skill
}: SkillTreeNodeProps) {
  const isUnlocked = areSkillRequirementsMet(character, displayedSkillLevels, skill);
  const isColored = level > 0 || (isSelected && isUnlocked);
  const iconSrc = getSkillIconUrl(skill.icon);

  return (
    <button
      aria-label={`Select ${skill.name}`}
      className={cx(
        "group absolute grid h-[50px] w-[50px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-[5px] border-2 border-[#12100c] bg-black/55 shadow-[0_2px_0_rgba(0,0,0,0.55),inset_0_0_0_1px_rgba(255,255,255,0.24)] transition hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ffe173]",
        !isUnlocked && "opacity-75",
        isSelected && "ring-2 ring-[#ffe173]"
      )}
      data-testid={`character_skills_button_select_${getTestIdSegment(skill.id)}`}
      onClick={(event) => {
        event.stopPropagation();
        onSelect();
      }}
      style={{ left: `${skill.x}%`, top: `${skill.y}%` }}
      type="button"
    >
      <Image
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full rounded-[3px] object-cover grayscale"
        draggable={false}
        height={56}
        src={iconSrc}
        unoptimized
        width={56}
      />
      <Image
        alt=""
        aria-hidden="true"
        className={cx(
          "absolute inset-0 h-full w-full rounded-[3px] object-cover opacity-0 transition-opacity",
          isColored && "opacity-100",
          isUnlocked && "group-hover:opacity-100"
        )}
        draggable={false}
        height={56}
        src={iconSrc}
        unoptimized
        width={56}
      />
      {level > 0 ? (
        <span
          className={cx(
            "absolute bottom-0.5 right-1 z-[1] min-w-5 text-right text-[0.9rem] font-extrabold uppercase leading-4 text-white",
            pendingLevel > 0
              ? "[text-shadow:-2px_-2px_0_#178a38,0_-2px_0_#178a38,2px_-2px_0_#178a38,-2px_0_0_#178a38,2px_0_0_#178a38,-2px_2px_0_#178a38,0_2px_0_#178a38,2px_2px_0_#178a38,0_1px_2px_rgba(0,0,0,0.95)]"
              : appliedLevel > 0
                ? "[text-shadow:-2px_-2px_0_#b72b2b,0_-2px_0_#b72b2b,2px_-2px_0_#b72b2b,-2px_0_0_#b72b2b,2px_0_0_#b72b2b,-2px_2px_0_#b72b2b,0_2px_0_#b72b2b,2px_2px_0_#b72b2b,0_1px_2px_rgba(0,0,0,0.95)]"
                : "[text-shadow:0_1px_2px_rgba(0,0,0,0.95)]"
          )}
          data-testid={`character_skills_span_level_${getTestIdSegment(skill.id)}`}
        >
          {level >= skill.maxLevel ? "MAX" : level}
        </span>
      ) : null}
      <span
        className="pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2 z-[50] hidden w-[220px] -translate-x-1/2 rounded-control border-2 border-border bg-[linear-gradient(180deg,rgba(31,29,22,0.98),rgba(9,9,7,0.98))] p-2.5 text-left text-xs text-foreground shadow-[0_10px_24px_rgba(0,0,0,0.5)] group-hover:block group-focus-visible:block"
        data-testid={`character_skills_span_tooltip_${getTestIdSegment(skill.id)}`}
        role="tooltip"
      >
        <strong
          className="block text-sm"
          data-testid={`character_skills_strong_tooltip_name_${getTestIdSegment(skill.id)}`}
        >
          {skill.name}
        </strong>
        <span
          className="mt-0.5 block font-bold text-text-muted"
          data-testid={`character_skills_span_tooltip_level_${getTestIdSegment(skill.id)}`}
        >
          Level {level}/{skill.maxLevel} · {skill.costPerLevel} SP per level
        </span>
        {skill.description ? (
          <span
            className="mt-2 block leading-4 text-text-muted"
            data-testid={`character_skills_span_tooltip_description_${getTestIdSegment(skill.id)}`}
          >
            {skill.description}
          </span>
        ) : null}
        <SkillRequirements
          character={character}
          className="mt-2"
          skill={skill}
          skillLevels={displayedSkillLevels}
        />
      </span>
    </button>
  );
}
