import Image from "next/image";
import { Minus, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { Actions } from "@/components/atoms/Actions";
import { Button } from "@/components/atoms/Button";
import { AllocationButton } from "@/components/atoms/main-application/AllocationButton";
import { Panel } from "@/components/atoms/Panel";
import { SectionHeading } from "@/components/molecules/main-application/SectionHeading";
import { SkillRequirements } from "@/components/molecules/main-application/SkillRequirements";
import { SkillTreeNode } from "@/components/molecules/main-application/SkillTreeNode";
import { PointsSummary } from "@/components/molecules/main-application/ContentHeading";
import { getSkillIconUrl, type Character, type CharacterSkillLevels } from "@/lib/api";
import { cx } from "@/lib/classNames";
import {
  areSkillRequirementsMet,
  type SkillDefinition,
  type SkillTreeTab,
  type SkillTreeTier
} from "@/lib/skillTrees";
import { getTestIdSegment } from "@/lib/testIds";

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
  return getSkillIconUrl(skill.icon);
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
    <Panel as="section" className="h-full w-full content-start" data-testid="character_skills_panel">
      <SectionHeading eyebrow="Skills" testId="character_skills_heading" />
      <div className="grid gap-3">
        <div className="relative pt-[38px]" data-testid="character_skills_div_tree_shell">
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
                data-testid={`character_skills_button_tab_${getTestIdSegment(tab.tier)}`}
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
            data-testid={`character_skills_div_tree_${getTestIdSegment(activeTab.tier)}`}
            onClick={() => setSelectedSkillId("")}
            role="tabpanel"
          >
            <div
              className="relative w-full max-w-[500px]"
              data-testid={`character_skills_div_tree_canvas_${getTestIdSegment(activeTab.tier)}`}
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

                return (
                  <SkillTreeNode
                    appliedLevel={appliedLevel}
                    character={character}
                    displayedSkillLevels={displayedSkillLevels}
                    isSelected={isSelected}
                    key={skill.id}
                    level={level}
                    onSelect={() => setSelectedSkillId(skill.id)}
                    pendingLevel={pendingLevel}
                    skill={skill}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {selectedSkill && (
          <div
            className="grid h-[240px] grid-cols-[72px_minmax(0,1fr)_94px] items-center gap-3 rounded-control border-2 border-border bg-[linear-gradient(180deg,rgba(31,29,22,0.92),rgba(9,9,7,0.96))] p-2.5 max-[560px]:h-[340px] max-[560px]:grid-cols-1"
            data-testid={`character_skills_div_selected_${getTestIdSegment(selectedSkill.id)}`}
          >
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
            <div
              className="min-w-0 pr-1"
              data-testid={`character_skills_div_selected_content_${getTestIdSegment(selectedSkill.id)}`}
            >
              <strong
                className="block truncate text-sm"
                data-testid={`character_skills_strong_selected_name_${getTestIdSegment(selectedSkill.id)}`}
              >
                {selectedSkill.name}
              </strong>
              <span
                className="text-xs font-bold text-text-muted"
                data-testid={`character_skills_span_selected_level_${getTestIdSegment(selectedSkill.id)}`}
              >
                Level {selectedLevel}/{selectedSkill.maxLevel} · {selectedSkill.costPerLevel} SP per level
              </span>
              {selectedSkill.description && (
                <span
                  className="mt-1 block text-xs leading-4 text-text-muted"
                  data-testid={`character_skills_span_selected_description_${getTestIdSegment(selectedSkill.id)}`}
                >
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
                <span
                  className="mt-1 block text-xs font-black text-[#54d978]"
                  data-testid={`character_skills_span_selected_pending_${getTestIdSegment(selectedSkill.id)}`}
                >
                  +{selectedPendingLevel} pending
                </span>
              )}
            </div>
            <div className="grid grid-cols-[28px_minmax(26px,1fr)_28px] items-center gap-1">
              <span className="group relative grid">
                <AllocationButton
                  type="button"
                  data-testid={`character_skills_button_remove_${getTestIdSegment(selectedSkill.id)}`}
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
                data-testid={`character_skills_span_selected_value_${getTestIdSegment(selectedSkill.id)}`}
              >
                {isSelectedMaxed ? "MAX" : selectedLevel}
              </span>
              <AllocationButton
                type="button"
                data-testid={`character_skills_button_add_${getTestIdSegment(selectedSkill.id)}`}
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
      <PointsSummary testId="character_skills_div_points_summary">
        <span data-testid="character_skills_span_available_label">Available skill points</span>
        <strong data-testid="character_skills_strong_available_value">{availableSkillPoints}</strong>
      </PointsSummary>
      <Actions gap={10}>
        <Button
          data-testid="character_skills_button_apply"
          type="button"
          onClick={onApplySkills}
          disabled={!hasPendingSkills}
        >
          Apply
        </Button>
        <Button
          data-testid="character_skills_button_reset"
          variant="secondary"
          type="button"
          onClick={onResetSkills}
          disabled={!hasPendingSkills}
        >
          Reset
        </Button>
      </Actions>
    </Panel>
  );
}
