import Image from "next/image";
import { Minus, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { Actions } from "@/components/atoms/Actions";
import { Button } from "@/components/atoms/Button";
import { AllocationButton } from "@/components/atoms/main-application/AllocationButton";
import { Panel } from "@/components/atoms/Panel";
import { SectionHeading } from "@/components/molecules/main-application/SectionHeading";
import { PointsSummary } from "@/components/molecules/main-application/ContentHeading";
import type { Character, CharacterSkillLevels } from "@/lib/api";
import { cx } from "@/lib/classNames";
import {
  areSkillRequirementsMet,
  type SkillDefinition,
  type SkillRequirement,
  type SkillTreeTab,
  type SkillTreeTier
} from "@/lib/skillTrees";

type CharacterSkillsPanelProps = {
  availableSkillPoints: number;
  character: Character;
  onAddSkillLevel: (skill: SkillDefinition) => void;
  onApplySkills: () => void;
  onCanRemoveSkillLevel: (skill: SkillDefinition) => boolean;
  onRemoveSkillLevel: (skill: SkillDefinition) => void;
  onResetSkills: () => void;
  pendingSkillLevels: CharacterSkillLevels;
  skillTabs: SkillTreeTab[];
};

function getDisplayedSkillLevel(
  character: Character,
  pendingSkillLevels: CharacterSkillLevels,
  skill: SkillDefinition
) {
  return (character.skillLevels[skill.id] ?? 0) + (pendingSkillLevels[skill.id] ?? 0);
}

function getSkillIconSrc(skill: SkillDefinition) {
  return `https://api.flyff.com/image/skill/colored/${skill.icon}`;
}

function isSkillRequirementMet(skillLevels: CharacterSkillLevels, requirement: SkillRequirement) {
  return (skillLevels[requirement.skill] ?? 0) >= requirement.level;
}

function SkillRequirements({
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
    <span className={cx("grid gap-1 text-xs font-bold", className)}>
      <span className="text-[0.68rem] font-black uppercase tracking-[0.08em] text-text-muted">
        Requirements
      </span>
      <span className={cx(isLevelMet ? "text-[#54d978]" : "text-[#ff5a58]")}>
        Level {skill.requiredLevel}
      </span>
      {skill.requirements.map((requirement) => {
        const requirementMet = isSkillRequirementMet(skillLevels, requirement);

        return (
          <span
            className={cx(requirementMet ? "text-[#54d978]" : "text-[#ff5a58]")}
            key={`${skill.id}-${requirement.skill}`}
          >
            {requirement.skillName} Lv. {requirement.level}
          </span>
        );
      })}
    </span>
  );
}

export function CharacterSkillsPanel({
  availableSkillPoints,
  character,
  onAddSkillLevel,
  onApplySkills,
  onCanRemoveSkillLevel,
  onRemoveSkillLevel,
  onResetSkills,
  pendingSkillLevels,
  skillTabs
}: CharacterSkillsPanelProps) {
  const [activeTier, setActiveTier] = useState<SkillTreeTier>(
    skillTabs[skillTabs.length - 1]?.tier ?? "vagrant"
  );
  const activeTab = skillTabs.find((tab) => tab.tier === activeTier) ?? skillTabs[skillTabs.length - 1];
  const [selectedSkillId, setSelectedSkillId] = useState(activeTab?.skills[0]?.id ?? "");
  const activeSkills = activeTab?.skills ?? [];
  const selectedSkill = activeSkills.find((skill) => skill.id === selectedSkillId);
  const hasPendingSkills = Object.values(pendingSkillLevels).some((level) => level > 0);

  useEffect(() => {
    if (skillTabs.length > 0 && !skillTabs.some((tab) => tab.tier === activeTier)) {
      setActiveTier(skillTabs[skillTabs.length - 1]?.tier ?? "vagrant");
    }
  }, [activeTier, skillTabs]);

  useEffect(() => {
    if (
      selectedSkillId &&
      activeSkills.length > 0 &&
      !activeSkills.some((skill) => skill.id === selectedSkillId)
    ) {
      setSelectedSkillId("");
    }
  }, [activeSkills, selectedSkillId]);

  if (!activeTab) {
    return null;
  }

  const displayedSkillLevels = { ...character.skillLevels };

  Object.entries(pendingSkillLevels).forEach(([skillId, level]) => {
    displayedSkillLevels[skillId] = (displayedSkillLevels[skillId] ?? 0) + level;
  });

  const selectedLevel = selectedSkill
    ? getDisplayedSkillLevel(character, pendingSkillLevels, selectedSkill)
    : 0;
  const selectedPendingLevel = selectedSkill ? (pendingSkillLevels[selectedSkill.id] ?? 0) : 0;
  const selectedAppliedLevel = selectedSkill ? (character.skillLevels[selectedSkill.id] ?? 0) : 0;
  const canRemoveSelectedSkillLevel = selectedSkill ? onCanRemoveSkillLevel(selectedSkill) : false;
  const isSelectedRemovalBlockedByRequirements =
    selectedSkill && selectedPendingLevel > 0 && !canRemoveSelectedSkillLevel;
  const isSelectedMaxed = selectedSkill ? selectedLevel >= selectedSkill.maxLevel : false;
  const isSelectedUnlocked = selectedSkill
    ? areSkillRequirementsMet(character, displayedSkillLevels, selectedSkill)
    : false;

  return (
    <Panel as="section" className="h-full w-full content-start">
      <SectionHeading eyebrow="Skills" />
      <div className="grid gap-3">
        <div className="relative pt-[38px]">
          <div
            className="absolute left-[3px] top-0 z-[2] flex flex-wrap justify-start"
            role="tablist"
            aria-label="Skill trees"
          >
            {skillTabs.map((tab) => (
              <button
                aria-controls={`skill-tree-${tab.tier}`}
                aria-selected={activeTab.tier === tab.tier}
                className={cx(
                  "min-h-[38px] w-[104px] cursor-pointer rounded-t-control border-[3px] border-b-0 border-border bg-[linear-gradient(180deg,rgba(24,23,17,0.96),rgba(8,8,7,0.96))] px-2 py-2 text-sm font-extrabold text-text-muted shadow-[inset_0_0_0_1px_rgba(255,225,115,0.1)] hover:bg-panel-muted hover:text-foreground",
                  activeTab.tier === tab.tier &&
                    "bg-[linear-gradient(180deg,rgba(255,225,115,0.2),rgba(29,26,18,0.98))] text-foreground"
                )}
                id={`skill-tab-${tab.tier}`}
                key={tab.tier}
                onClick={() => setActiveTier(tab.tier)}
                role="tab"
                type="button"
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div
            aria-labelledby={`skill-tab-${activeTab.tier}`}
            className="relative z-[3] grid min-h-[180px] place-items-center rounded-card border-[3px] border-border bg-[radial-gradient(circle_at_50%_38%,rgba(255,230,119,0.08),transparent_34%),linear-gradient(180deg,rgba(14,14,11,0.94),rgba(0,0,0,0.98))] p-4 shadow-[inset_0_0_0_2px_rgba(255,225,115,0.12)]"
            id={`skill-tree-${activeTab.tier}`}
            onClick={() => setSelectedSkillId("")}
            role="tabpanel"
          >
            <div
              className="relative w-full max-w-[500px]"
              style={{ aspectRatio: `${activeTab.imageWidth} / ${activeTab.imageHeight}` }}
            >
              <Image
                className="absolute inset-0 h-full w-full object-contain [image-rendering:auto]"
                src={activeTab.imageSrc}
                alt={`${activeTab.label} skill tree`}
                width={activeTab.imageWidth}
                height={activeTab.imageHeight}
                unoptimized
              />
              {activeSkills.map((skill) => {
                const level = getDisplayedSkillLevel(character, pendingSkillLevels, skill);
                const pendingLevel = pendingSkillLevels[skill.id] ?? 0;
                const appliedLevel = character.skillLevels[skill.id] ?? 0;
                const isSelected = selectedSkill?.id === skill.id;
                const isUnlocked = areSkillRequirementsMet(character, displayedSkillLevels, skill);
                const isColored = level > 0 || (isSelected && isUnlocked);

                return (
                  <button
                    aria-label={`Select ${skill.name}`}
                    className={cx(
                      "group absolute grid h-[50px] w-[50px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-[5px] border-2 border-[#12100c] bg-black/55 shadow-[0_2px_0_rgba(0,0,0,0.55),inset_0_0_0_1px_rgba(255,255,255,0.24)] transition hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ffe173]",
                      !isUnlocked && "opacity-75",
                      isSelected && "ring-2 ring-[#ffe173]"
                    )}
                    key={skill.id}
                    onClick={(event) => {
                      event.stopPropagation();
                      setSelectedSkillId(skill.id);
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
                      src={getSkillIconSrc(skill)}
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
                      src={getSkillIconSrc(skill)}
                      unoptimized
                      width={56}
                    />
                    {level > 0 && (
                      <span
                        className={cx(
                          "absolute bottom-0.5 right-1 z-[1] min-w-5 text-right text-[0.9rem] font-extrabold uppercase leading-4 text-white",
                          pendingLevel > 0
                            ? "[text-shadow:-2px_-2px_0_#178a38,0_-2px_0_#178a38,2px_-2px_0_#178a38,-2px_0_0_#178a38,2px_0_0_#178a38,-2px_2px_0_#178a38,0_2px_0_#178a38,2px_2px_0_#178a38,0_1px_2px_rgba(0,0,0,0.95)]"
                            : appliedLevel > 0
                              ? "[text-shadow:-2px_-2px_0_#b72b2b,0_-2px_0_#b72b2b,2px_-2px_0_#b72b2b,-2px_0_0_#b72b2b,2px_0_0_#b72b2b,-2px_2px_0_#b72b2b,0_2px_0_#b72b2b,2px_2px_0_#b72b2b,0_1px_2px_rgba(0,0,0,0.95)]"
                              : "[text-shadow:0_1px_2px_rgba(0,0,0,0.95)]"
                        )}
                      >
                        {level >= skill.maxLevel ? "MAX" : level}
                      </span>
                    )}
                    <span
                      className="pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2 z-[50] hidden w-[220px] -translate-x-1/2 rounded-control border-2 border-border bg-[linear-gradient(180deg,rgba(31,29,22,0.98),rgba(9,9,7,0.98))] p-2.5 text-left text-xs text-foreground shadow-[0_10px_24px_rgba(0,0,0,0.5)] group-hover:block group-focus-visible:block"
                      role="tooltip"
                    >
                      <strong className="block text-sm">{skill.name}</strong>
                      <span className="mt-0.5 block font-bold text-text-muted">
                        Level {level}/{skill.maxLevel} · {skill.costPerLevel} SP per level
                      </span>
                      {skill.description && (
                        <span className="mt-2 block leading-4 text-text-muted">{skill.description}</span>
                      )}
                      <SkillRequirements
                        character={character}
                        className="mt-2"
                        skill={skill}
                        skillLevels={displayedSkillLevels}
                      />
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {selectedSkill && (
          <div className="grid h-[240px] grid-cols-[72px_minmax(0,1fr)_94px] items-center gap-3 rounded-control border-2 border-border bg-[linear-gradient(180deg,rgba(31,29,22,0.92),rgba(9,9,7,0.96))] p-2.5 max-[560px]:h-[340px] max-[560px]:grid-cols-1">
            <div
              className="relative grid h-[58px] w-[58px] place-items-center overflow-hidden rounded-[6px] border-2 border-[#12100c] bg-black/55 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.28)]"
              aria-hidden="true"
            >
              <Image
                alt=""
                aria-hidden="true"
                className={cx(
                  "h-full w-full object-cover",
                  selectedLevel <= 0 && !isSelectedUnlocked && "grayscale"
                )}
                draggable={false}
                height={58}
                src={getSkillIconSrc(selectedSkill)}
                unoptimized
                width={58}
              />
            </div>
            <div className="min-w-0 pr-1">
              <strong className="block truncate text-sm">{selectedSkill.name}</strong>
              <span className="text-xs font-bold text-text-muted">
                Level {selectedLevel}/{selectedSkill.maxLevel} · {selectedSkill.costPerLevel} SP per level
              </span>
              {selectedSkill.description && (
                <span className="mt-1 block text-xs leading-4 text-text-muted">
                  {selectedSkill.description}
                </span>
              )}
              <SkillRequirements
                character={character}
                className="mt-2"
                skill={selectedSkill}
                skillLevels={displayedSkillLevels}
              />
              {selectedPendingLevel > 0 && (
                <span className="mt-1 block text-xs font-black text-[#54d978]">
                  +{selectedPendingLevel} pending
                </span>
              )}
            </div>
            <div className="grid grid-cols-[28px_minmax(26px,1fr)_28px] items-center gap-1">
              <span className="group relative grid">
                <AllocationButton
                  type="button"
                  aria-label={`Remove pending ${selectedSkill.name} level`}
                  onClick={() => onRemoveSkillLevel(selectedSkill)}
                  disabled={!canRemoveSelectedSkillLevel}
                >
                  <Minus aria-hidden="true" size={14} />
                </AllocationButton>
                {isSelectedRemovalBlockedByRequirements && (
                  <span className="pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2 z-20 hidden w-[190px] -translate-x-1/2 rounded-control border-2 border-border bg-[linear-gradient(180deg,rgba(31,29,22,0.98),rgba(9,9,7,0.98))] p-2 text-center text-xs font-bold text-[#ffb45e] shadow-[0_10px_24px_rgba(0,0,0,0.5)] group-hover:block group-focus-within:block">
                    Required by another selected skill
                  </span>
                )}
              </span>
              <span
                className={cx(
                  "px-1 text-center text-[0.76rem] font-extrabold uppercase leading-7 [text-shadow:0_1px_2px_rgba(0,0,0,0.95)]",
                  selectedPendingLevel > 0
                    ? "text-[#54d978]"
                    : selectedAppliedLevel > 0
                      ? "text-[#ff5a58]"
                      : "text-text-muted"
                )}
              >
                {isSelectedMaxed ? "MAX" : selectedLevel}
              </span>
              <AllocationButton
                type="button"
                aria-label={`Add ${selectedSkill.name} level`}
                onClick={() => onAddSkillLevel(selectedSkill)}
                disabled={
                  isSelectedMaxed || !isSelectedUnlocked || availableSkillPoints < selectedSkill.costPerLevel
                }
              >
                <Plus aria-hidden="true" size={14} />
              </AllocationButton>
            </div>
          </div>
        )}
      </div>
      <PointsSummary>
        <span>Available skill points</span>
        <strong>{availableSkillPoints}</strong>
      </PointsSummary>
      <Actions gap={10}>
        <Button type="button" onClick={onApplySkills} disabled={!hasPendingSkills}>
          Apply
        </Button>
        <Button variant="secondary" type="button" onClick={onResetSkills} disabled={!hasPendingSkills}>
          Reset
        </Button>
      </Actions>
    </Panel>
  );
}
