"use client";

import Image from "next/image";
import { Swords } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import { MutedText } from "@/components/atoms/MutedText";
import { Panel } from "@/components/atoms/Panel";
import { CharacterEquipmentPanel } from "@/components/molecules/main-application/CharacterEquipmentPanel";
import { SectionHeading } from "@/components/molecules/main-application/SectionHeading";
import {
  getMonsterIconUrl,
  type Character,
  type ItemMetadata,
  type MapMonsterFamily,
  type MonsterFamilyVariant
} from "@/lib/api";
import { cx } from "@/lib/classNames";
import {
  getUnlockedSkills,
  type SkillCombo,
  type SkillDefinition,
  type SkillTreeTab
} from "@/lib/skillTrees";

type ActionSlot = SkillDefinition | null;

type BattlePageProps = {
  character: Character;
  itemsById: Record<string, ItemMetadata>;
  selectedMonsterFamily: MapMonsterFamily | null;
  skillTabs: SkillTreeTab[];
};

type CharacterPanelTab = "equipment" | "skills";

const actionSlotPositions = [
  { left: "50%", top: "18%" },
  { left: "73%", top: "34%" },
  { left: "73%", top: "62%" },
  { left: "50%", top: "78%" },
  { left: "27%", top: "62%" },
  { left: "27%", top: "34%" }
];

const actionSlotFillOrder = [3, 2, 1, 0, 5, 4];
const skillDragDataType = "application/x-flyff-skill-id";
const actionSlotDragDataType = "application/x-flyff-action-slot-index";

function getSkillIconSrc(skill: SkillDefinition) {
  return `https://api.flyff.com/image/skill/colored/${skill.icon}`;
}

function getTestIdSegment(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function formatBattleValue(value: number | string | null | undefined) {
  return value === null || value === undefined ? "Unknown" : String(value);
}

function getVariantPower(variant: MonsterFamilyVariant | null) {
  if (!variant) {
    return 0;
  }

  return Math.max(1, Math.round(((variant.minAttack ?? 0) + (variant.maxAttack ?? 0)) / 2));
}

function getSkillCombo(skill: SkillDefinition): SkillCombo {
  return skill.combo ?? "general";
}

function isValidActionSequence(skills: SkillDefinition[]) {
  const hasComboPieces = skills.some((skill) => getSkillCombo(skill) !== "general");

  if (!hasComboPieces) {
    return true;
  }

  let hasFinish = false;

  return skills.every((skill, index) => {
    const combo = getSkillCombo(skill);
    const previousCombo = index > 0 ? getSkillCombo(skills[index - 1]) : null;

    if (combo === "general") {
      return hasFinish;
    }

    if (combo === "step") {
      return index === 0;
    }

    if (combo === "circular") {
      return !hasFinish && (previousCombo === "step" || previousCombo === "circular");
    }

    const isValid = previousCombo === "step" || previousCombo === "circular";

    hasFinish = hasFinish || isValid;
    return isValid;
  });
}

function getActionSequence(slots: ActionSlot[]) {
  return actionSlotFillOrder
    .map((slotIndex) => slots[slotIndex])
    .filter((skill): skill is SkillDefinition => Boolean(skill));
}

function getActionSequenceIndex(slotIndex: number) {
  return actionSlotFillOrder.indexOf(slotIndex);
}

function createActionSlotsFromSequence(skills: SkillDefinition[]) {
  const nextSlots: ActionSlot[] = Array.from({ length: actionSlotPositions.length }, () => null);

  skills.forEach((skill, index) => {
    const slotIndex = actionSlotFillOrder[index];

    if (slotIndex !== undefined) {
      nextSlots[slotIndex] = skill;
    }
  });

  return nextSlots;
}

function canUseActionSequence(skills: SkillDefinition[]) {
  return skills.length <= actionSlotFillOrder.length && isValidActionSequence(skills);
}

function getDraggedActionSlotIndex(event: DragEvent<HTMLElement>) {
  const slotIndex = event.dataTransfer.getData(actionSlotDragDataType);

  return slotIndex === "" ? null : Number(slotIndex);
}

export function BattlePage({ character, itemsById, selectedMonsterFamily, skillTabs }: BattlePageProps) {
  const unlockedSkills = useMemo(() => getUnlockedSkills(skillTabs), [skillTabs]);
  const usableSkills = unlockedSkills.filter((skill) => (character.skillLevels[skill.id] ?? 0) > 0);
  const listedSkills = usableSkills.length > 0 ? usableSkills : unlockedSkills.slice(0, 8);
  const [activeCharacterTab, setActiveCharacterTab] = useState<CharacterPanelTab>("equipment");
  const [activeEquipmentSet, setActiveEquipmentSet] = useState(0);
  const [selectedEquipmentItemId, setSelectedEquipmentItemId] = useState<string | null>(null);
  const [selectedActionSlotIndex, setSelectedActionSlotIndex] = useState(actionSlotFillOrder[0]);
  const [actionSlots, setActionSlots] = useState<ActionSlot[]>(() =>
    Array.from({ length: actionSlotPositions.length }, () => null)
  );
  const selectedVariant =
    selectedMonsterFamily?.variants.find((variant) => variant.variantRank === "normal") ??
    selectedMonsterFamily?.variants[0] ??
    null;
  const characterHp = Math.round(420 + character.level * 32 + character.stats.sta * 18);
  const characterFp = Math.round(
    120 + character.level * 7 + character.stats.str * 4 + character.stats.sta * 5
  );
  const characterMp = Math.round(95 + character.level * 8 + character.stats.int * 12);
  const characterAttack = Math.round(
    character.stats.str * 4 + character.stats.dex * 1.5 + character.level * 2
  );
  const monsterHp = selectedVariant?.hp ?? Math.max(120, (selectedVariant?.level ?? character.level) * 160);
  const monsterAttack = getVariantPower(selectedVariant);

  useEffect(() => {
    setSelectedEquipmentItemId(null);
  }, [activeEquipmentSet]);

  function addSkillToFirstAvailableSlot(skill: SkillDefinition) {
    let nextSelectedActionSlotIndex: number | null = null;

    setActionSlots((currentSlots) => {
      const currentSequence = getActionSequence(currentSlots);
      const nextSequence = [...currentSequence, skill];

      if (!canUseActionSequence(nextSequence)) {
        return currentSlots;
      }

      nextSelectedActionSlotIndex = actionSlotFillOrder[currentSequence.length] ?? null;
      return createActionSlotsFromSequence(nextSequence);
    });

    if (nextSelectedActionSlotIndex !== null) {
      setSelectedActionSlotIndex(nextSelectedActionSlotIndex);
    }
  }

  function insertSkillAtActionSlot(skill: SkillDefinition, targetSlotIndex: number) {
    let nextSelectedActionSlotIndex: number | null = null;

    setActionSlots((currentSlots) => {
      const targetSkill = currentSlots[targetSlotIndex];
      const currentSequence = getActionSequence(currentSlots);

      if (!targetSkill) {
        const nextSequence = [...currentSequence, skill];

        if (!canUseActionSequence(nextSequence)) {
          return currentSlots;
        }

        nextSelectedActionSlotIndex = actionSlotFillOrder[currentSequence.length] ?? null;
        return createActionSlotsFromSequence(nextSequence);
      }

      const targetSequenceIndex = getActionSequenceIndex(targetSlotIndex);
      const nextSequence = [
        ...currentSequence.slice(0, targetSequenceIndex),
        skill,
        ...currentSequence.slice(targetSequenceIndex)
      ];

      if (!canUseActionSequence(nextSequence)) {
        return currentSlots;
      }

      nextSelectedActionSlotIndex = targetSlotIndex;
      return createActionSlotsFromSequence(nextSequence);
    });

    if (nextSelectedActionSlotIndex !== null) {
      setSelectedActionSlotIndex(nextSelectedActionSlotIndex);
    }
  }

  function removeActionSlot(slotIndex: number) {
    let didRemoveSlot = false;

    setActionSlots((currentSlots) => {
      const nextSequence = actionSlotFillOrder
        .filter((currentSlotIndex) => currentSlotIndex !== slotIndex)
        .map((currentSlotIndex) => currentSlots[currentSlotIndex])
        .filter((skill): skill is SkillDefinition => Boolean(skill));

      if (!canUseActionSequence(nextSequence)) {
        return currentSlots;
      }

      didRemoveSlot = true;
      return createActionSlotsFromSequence(nextSequence);
    });

    if (didRemoveSlot && selectedActionSlotIndex === slotIndex) {
      setSelectedActionSlotIndex(actionSlotFillOrder[0]);
    }
  }

  function moveActionSlot(sourceSlotIndex: number, targetSlotIndex: number) {
    let nextSelectedActionSlotIndex: number | null = null;

    setActionSlots((currentSlots) => {
      const sourceSkill = currentSlots[sourceSlotIndex];

      if (sourceSlotIndex === targetSlotIndex || !sourceSkill || !currentSlots[targetSlotIndex]) {
        return currentSlots;
      }

      const sourceSequenceIndex = getActionSequenceIndex(sourceSlotIndex);
      const targetSequenceIndex = getActionSequenceIndex(targetSlotIndex);
      const currentSequence = getActionSequence(currentSlots);
      const sequenceWithoutSource = currentSequence.filter((_skill, index) => index !== sourceSequenceIndex);
      const nextSequence = [
        ...sequenceWithoutSource.slice(0, targetSequenceIndex),
        sourceSkill,
        ...sequenceWithoutSource.slice(targetSequenceIndex)
      ];

      if (!canUseActionSequence(nextSequence)) {
        return currentSlots;
      }

      nextSelectedActionSlotIndex = targetSlotIndex;
      return createActionSlotsFromSequence(nextSequence);
    });

    if (nextSelectedActionSlotIndex !== null) {
      setSelectedActionSlotIndex(nextSelectedActionSlotIndex);
    }
  }

  return (
    <section
      className="grid min-h-0 gap-4 xl:grid-cols-[minmax(280px,0.95fr)_minmax(420px,1.15fr)_minmax(300px,0.9fr)]"
      data-testid="battle_section_page"
    >
      <CharacterCombatPanel
        actionSlots={actionSlots}
        activeEquipmentSet={activeEquipmentSet}
        activeTab={activeCharacterTab}
        character={character}
        characterFp={characterFp}
        characterHp={characterHp}
        characterMp={characterMp}
        itemsById={itemsById}
        onAddSkillToActionSlot={addSkillToFirstAvailableSlot}
        onInsertSkillAtActionSlot={insertSkillAtActionSlot}
        onMoveActionSlot={moveActionSlot}
        onRemoveActionSlot={removeActionSlot}
        onSelectActionSlot={setSelectedActionSlotIndex}
        onSelectEquipmentItem={setSelectedEquipmentItemId}
        onSelectEquipmentSet={setActiveEquipmentSet}
        onTabChange={setActiveCharacterTab}
        selectedActionSlotIndex={selectedActionSlotIndex}
        selectedEquipmentItemId={selectedEquipmentItemId}
        skillTabs={skillTabs}
        skills={listedSkills}
      />

      <Panel
        as="section"
        className="min-h-[620px] content-between overflow-hidden bg-[radial-gradient(circle_at_50%_26%,rgba(226,179,63,0.16),transparent_34%),linear-gradient(180deg,rgba(20,20,15,0.94),rgba(3,3,3,0.98))]"
        data-testid="battle_panel_arena"
      >
        <div className="flex items-start justify-between gap-3" data-testid="battle_div_arena_header">
          <SectionHeading
            eyebrow="Battle"
            testId="battle_heading_arena"
            title={selectedMonsterFamily?.name ?? "Choose a monster"}
          />
          <div
            className="rounded-control border border-border bg-black/35 px-3 py-2 text-right text-xs font-black uppercase tracking-wide text-[#fff1ba]"
            data-testid="battle_div_equipment_set"
          >
            Set {activeEquipmentSet + 1}
          </div>
        </div>
        <div className="grid min-h-[320px] place-items-center" data-testid="battle_div_arena_stage">
          <div
            className="grid w-full max-w-[560px] grid-cols-[1fr_auto_1fr] items-center gap-4"
            data-testid="battle_div_combatants"
          >
            <CombatantBadge label={character.name} value={`ATK ${characterAttack}`} />
            <div
              className="grid h-16 w-16 place-items-center rounded-full border-2 border-[#d7b84e] bg-black/45 text-[#ffe173] shadow-[0_0_24px_rgba(226,179,63,0.2)]"
              data-testid="battle_div_versus_icon"
            >
              <Swords aria-hidden="true" size={30} />
            </div>
            <CombatantBadge
              align="right"
              label={selectedVariant?.name ?? selectedMonsterFamily?.name ?? "No target"}
              value={`ATK ${monsterAttack || "?"}`}
            />
          </div>
        </div>
        <div className="grid gap-4" data-testid="battle_div_arena_timelines">
          <AttackTimeline label="Character attack" progress={68} />
        </div>
      </Panel>

      <div className="grid min-h-0 content-start gap-4" data-testid="battle_div_monster_column">
        <MonsterPanel
          monsterFamily={selectedMonsterFamily}
          selectedVariant={selectedVariant}
          monsterHp={monsterHp}
        />
        <Panel as="section" className="content-start gap-4" data-testid="battle_panel_monster_actions">
          <SectionHeading eyebrow="Monster Actions" testId="battle_heading_monster_actions" />
          <AttackTimeline label="Attack" progress={46} tone="danger" />
          <MonsterSpecialBar selectedVariant={selectedVariant} />
        </Panel>
      </div>
    </section>
  );
}

function CharacterCombatPanel({
  actionSlots,
  activeEquipmentSet,
  activeTab,
  character,
  characterFp,
  characterHp,
  characterMp,
  itemsById,
  onMoveActionSlot,
  onRemoveActionSlot,
  onSelectActionSlot,
  onSelectEquipmentItem,
  onSelectEquipmentSet,
  onTabChange,
  onAddSkillToActionSlot,
  selectedActionSlotIndex,
  selectedEquipmentItemId,
  onInsertSkillAtActionSlot,
  skillTabs,
  skills
}: {
  actionSlots: ActionSlot[];
  activeEquipmentSet: number;
  activeTab: CharacterPanelTab;
  character: Character;
  characterFp: number;
  characterHp: number;
  characterMp: number;
  itemsById: Record<string, ItemMetadata>;
  onAddSkillToActionSlot: (skill: SkillDefinition) => void;
  onInsertSkillAtActionSlot: (skill: SkillDefinition, targetSlotIndex: number) => void;
  onMoveActionSlot: (sourceSlotIndex: number, targetSlotIndex: number) => void;
  onRemoveActionSlot: (slotIndex: number) => void;
  onSelectActionSlot: (slotIndex: number) => void;
  onSelectEquipmentItem: (itemId: string) => void;
  onSelectEquipmentSet: (setIndex: number) => void;
  onTabChange: (tab: CharacterPanelTab) => void;
  selectedActionSlotIndex: number;
  selectedEquipmentItemId: string | null;
  skillTabs: SkillTreeTab[];
  skills: SkillDefinition[];
}) {
  return (
    <Panel as="section" className="min-h-0 content-start gap-4" data-testid="battle_panel_character">
      <SectionHeading eyebrow="Character" testId="battle_heading_character" title={character.name} />
      <div className="grid gap-3" data-testid="battle_div_character_status">
        <StatusBar
          label="HP"
          testIdPrefix="battle_character"
          value={characterHp}
          max={characterHp}
          tone="hp"
        />
        <StatusBar
          label="FP"
          testIdPrefix="battle_character"
          value={characterFp}
          max={characterFp}
          tone="fp"
        />
        <StatusBar
          label="MP"
          testIdPrefix="battle_character"
          value={characterMp}
          max={characterMp}
          tone="mp"
        />
      </div>
      <div
        className="grid grid-cols-2 gap-1 rounded-control border border-border bg-black/35 p-1"
        data-testid="battle_div_character_tabs"
      >
        {[
          { id: "equipment", label: "Equipment" },
          { id: "skills", label: "Skills" }
        ].map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <button
              aria-pressed={isActive}
              data-testid={`battle_button_character_tab_${getTestIdSegment(tab.id)}`}
              className={cx(
                "min-h-9 rounded-[4px] px-2 text-sm font-black transition-colors",
                isActive
                  ? "bg-primary text-button-text"
                  : "text-text-muted hover:bg-panel-muted hover:text-foreground"
              )}
              key={tab.id}
              onClick={() => onTabChange(tab.id as CharacterPanelTab)}
              type="button"
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      {activeTab === "equipment" ? (
        <BattleEquipmentPanel
          activeEquipmentSet={activeEquipmentSet}
          character={character}
          itemsById={itemsById}
          onSelectEquipmentItem={onSelectEquipmentItem}
          onSelectEquipmentSet={onSelectEquipmentSet}
          selectedEquipmentItemId={selectedEquipmentItemId}
        />
      ) : (
        <div className="grid gap-4" data-testid="battle_div_skills_and_actions">
          <BattleSkillTrees
            character={character}
            onAddSkillToActionSlot={onAddSkillToActionSlot}
            skillTabs={skillTabs}
          />
          <ActionWheel
            actionSlots={actionSlots}
            onAddSkillToActionSlot={onAddSkillToActionSlot}
            onInsertSkillAtActionSlot={onInsertSkillAtActionSlot}
            onMoveActionSlot={onMoveActionSlot}
            onRemoveActionSlot={onRemoveActionSlot}
            selectedActionSlotIndex={selectedActionSlotIndex}
            onSelectActionSlot={onSelectActionSlot}
            skills={skills}
          />
        </div>
      )}
    </Panel>
  );
}

function BattleEquipmentPanel({
  activeEquipmentSet,
  character,
  itemsById,
  onSelectEquipmentItem,
  onSelectEquipmentSet,
  selectedEquipmentItemId
}: {
  activeEquipmentSet: number;
  character: Character;
  itemsById: Record<string, ItemMetadata>;
  onSelectEquipmentItem: (itemId: string) => void;
  onSelectEquipmentSet: (setIndex: number) => void;
  selectedEquipmentItemId: string | null;
}) {
  return (
    <CharacterEquipmentPanel
      activeEquipmentSet={activeEquipmentSet}
      character={character}
      itemsById={itemsById}
      onEquipmentSetChange={onSelectEquipmentSet}
      onSelectEquipmentItem={onSelectEquipmentItem}
      selectedEquipmentItemId={selectedEquipmentItemId}
      showItemDetails={false}
      variant="embedded"
    />
  );
}

function StatusBar({
  label,
  max,
  testIdPrefix,
  tone,
  value
}: {
  label: string;
  max: number;
  testIdPrefix: string;
  tone: "hp" | "fp" | "mp";
  value: number;
}) {
  const percent = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  const toneClass = {
    hp: "from-[#ff4f4f] to-[#9b1717]",
    fp: "from-[#ffb14f] to-[#9b5317]",
    mp: "from-[#4f91ff] to-[#17459b]"
  }[tone];
  const testId = `${testIdPrefix}_${getTestIdSegment(label)}`;

  return (
    <div className="grid gap-1" data-testid={`${testId}_div_status`}>
      <div
        className="flex items-center justify-between gap-2 text-xs font-black uppercase tracking-wide"
        data-testid={`${testId}_div_status_header`}
      >
        <span data-testid={`${testId}_span_status_label`}>{label}</span>
        <span className="text-text-muted" data-testid={`${testId}_span_status_value`}>
          {value} / {max}
        </span>
      </div>
      <div
        className="h-5 overflow-hidden rounded-[4px] border border-border bg-black/55 shadow-[inset_0_2px_6px_rgba(0,0,0,0.72)]"
        data-testid={`${testId}_div_status_track`}
      >
        <div
          className={cx("h-full bg-gradient-to-r shadow-[inset_0_1px_0_rgba(255,255,255,0.32)]", toneClass)}
          data-testid={`${testId}_div_status_fill`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

function AttackTimeline({
  label,
  progress,
  tone = "primary"
}: {
  label: string;
  progress: number;
  tone?: "primary" | "danger";
}) {
  return (
    <div className="grid gap-1" data-testid={`battle_div_timeline_${getTestIdSegment(label)}`}>
      <div
        className="flex items-center justify-between text-xs font-black uppercase tracking-wide text-text-muted"
        data-testid={`battle_div_timeline_header_${getTestIdSegment(label)}`}
      >
        <span data-testid={`battle_span_timeline_label_${getTestIdSegment(label)}`}>{label}</span>
        <span data-testid={`battle_span_timeline_value_${getTestIdSegment(label)}`}>{progress}%</span>
      </div>
      <div
        className="h-4 overflow-hidden rounded-[999px] border border-border bg-black/55"
        data-testid={`battle_div_timeline_track_${getTestIdSegment(label)}`}
      >
        <div
          className={cx(
            "h-full rounded-[999px]",
            tone === "danger"
              ? "bg-gradient-to-r from-[#ff7b58] to-[#c82c2c]"
              : "bg-gradient-to-r from-[#ffe173] to-[#d88f2e]"
          )}
          data-testid={`battle_div_timeline_fill_${getTestIdSegment(label)}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

function BattleSkillTrees({
  character,
  onAddSkillToActionSlot,
  skillTabs
}: {
  character: Character;
  onAddSkillToActionSlot: (skill: SkillDefinition) => void;
  skillTabs: SkillTreeTab[];
}) {
  const [activeTier, setActiveTier] = useState(skillTabs[skillTabs.length - 1]?.tier ?? "vagrant");
  const activeTab = skillTabs.find((tab) => tab.tier === activeTier) ?? skillTabs[skillTabs.length - 1];
  const activeSkills = activeTab?.skills ?? [];

  useEffect(() => {
    if (skillTabs.length > 0 && !skillTabs.some((tab) => tab.tier === activeTier)) {
      setActiveTier(skillTabs[skillTabs.length - 1]?.tier ?? "vagrant");
    }
  }, [activeTier, skillTabs]);

  if (!activeTab) {
    return <MutedText data-testid="battle_p_no_skill_trees">No skill trees are available yet.</MutedText>;
  }

  return (
    <div className="grid gap-2" data-testid="battle_div_skill_trees">
      <div className="relative pt-[34px]" data-testid="battle_div_skill_tree_shell">
        <div
          aria-label="Battle skill trees"
          className="absolute left-[3px] top-0 z-[2] flex flex-wrap justify-start"
          data-testid="battle_div_skill_tabs"
          role="tablist"
        >
          {skillTabs.map((tab) => (
            <button
              aria-controls={`battle-skill-tree-${tab.tier}`}
              aria-selected={activeTab.tier === tab.tier}
              data-testid={`battle_skills_button_tab_${getTestIdSegment(tab.tier)}`}
              className={cx(
                "min-h-[34px] w-[92px] rounded-t-control border-2 border-b-0 border-border bg-[linear-gradient(180deg,rgba(24,23,17,0.96),rgba(8,8,7,0.96))] px-2 py-1.5 text-xs font-extrabold text-text-muted shadow-[inset_0_0_0_1px_rgba(255,225,115,0.1)] hover:bg-panel-muted hover:text-foreground",
                activeTab.tier === tab.tier &&
                  "bg-[linear-gradient(180deg,rgba(255,225,115,0.2),rgba(29,26,18,0.98))] text-foreground"
              )}
              id={`battle-skill-tab-${tab.tier}`}
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
          aria-labelledby={`battle-skill-tab-${activeTab.tier}`}
          className="relative z-[3] grid min-h-[168px] place-items-center rounded-card border-2 border-border bg-[radial-gradient(circle_at_50%_38%,rgba(255,230,119,0.08),transparent_34%),linear-gradient(180deg,rgba(14,14,11,0.94),rgba(0,0,0,0.98))] p-2 shadow-[inset_0_0_0_1px_rgba(255,225,115,0.12)]"
          data-testid={`battle_div_skill_tree_${getTestIdSegment(activeTab.tier)}`}
          id={`battle-skill-tree-${activeTab.tier}`}
          role="tabpanel"
        >
          <div
            className="relative w-full"
            data-testid={`battle_div_skill_tree_canvas_${getTestIdSegment(activeTab.tier)}`}
            style={{ aspectRatio: `${activeTab.imageWidth} / ${activeTab.imageHeight}` }}
          >
            <Image
              alt={`${activeTab.label} skill tree`}
              className="absolute inset-0 h-full w-full object-contain"
              height={activeTab.imageHeight}
              src={activeTab.imageSrc}
              unoptimized
              width={activeTab.imageWidth}
            />
            {activeSkills.map((skill) => {
              const level = character.skillLevels[skill.id] ?? 0;
              const canAddSkill = level > 0;

              return (
                <button
                  aria-label={`${canAddSkill ? "Add" : "Unavailable"} ${skill.name} to action bar`}
                  data-testid={`battle_skills_button_add_${getTestIdSegment(skill.id)}`}
                  className={cx(
                    "group absolute grid aspect-square w-[15%] min-w-[46px] max-w-[72px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-[5px] border-2 border-[#12100c] bg-black/55 shadow-[0_2px_0_rgba(0,0,0,0.55),inset_0_0_0_1px_rgba(255,255,255,0.24)] transition hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ffe173]",
                    !canAddSkill && "opacity-70"
                  )}
                  draggable={canAddSkill}
                  key={skill.id}
                  onClick={(event) => {
                    if (canAddSkill && event.detail > 0 && event.detail % 2 === 0) {
                      onAddSkillToActionSlot(skill);
                    }
                  }}
                  onDragStart={(event) => {
                    if (!canAddSkill) {
                      event.preventDefault();
                      return;
                    }

                    event.dataTransfer.effectAllowed = "copy";
                    event.dataTransfer.setData(skillDragDataType, skill.id);
                  }}
                  style={{ left: `${skill.x}%`, top: `${skill.y}%` }}
                  title={skill.name}
                  type="button"
                >
                  <Image
                    alt=""
                    aria-hidden="true"
                    className={cx("h-full w-full rounded-[3px] object-cover", !canAddSkill && "grayscale")}
                    draggable={false}
                    height={38}
                    src={getSkillIconSrc(skill)}
                    unoptimized
                    width={38}
                  />
                  {level > 0 && (
                    <span
                      className="absolute bottom-0 right-0.5 min-w-4 text-right text-[0.72rem] font-extrabold leading-3 text-white [text-shadow:-1px_-1px_0_#b72b2b,0_-1px_0_#b72b2b,1px_-1px_0_#b72b2b,-1px_0_0_#b72b2b,1px_0_0_#b72b2b,-1px_1px_0_#b72b2b,0_1px_0_#b72b2b,1px_1px_0_#b72b2b]"
                      data-testid={`battle_span_skill_level_${getTestIdSegment(skill.id)}`}
                    >
                      {level >= skill.maxLevel ? "MAX" : level}
                    </span>
                  )}
                  <span
                    className="pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2 z-[50] hidden w-[190px] -translate-x-1/2 rounded-control border-2 border-border bg-[linear-gradient(180deg,rgba(31,29,22,0.98),rgba(9,9,7,0.98))] p-2 text-left text-xs text-foreground shadow-[0_10px_24px_rgba(0,0,0,0.5)] group-hover:block group-focus-visible:block"
                    data-testid={`battle_span_skill_tooltip_${getTestIdSegment(skill.id)}`}
                    role="tooltip"
                  >
                    <strong
                      className="block text-sm"
                      data-testid={`battle_strong_skill_tooltip_name_${getTestIdSegment(skill.id)}`}
                    >
                      {skill.name}
                    </strong>
                    <span
                      className="mt-0.5 block font-bold text-text-muted"
                      data-testid={`battle_span_skill_tooltip_level_${getTestIdSegment(skill.id)}`}
                    >
                      Level {level}/{skill.maxLevel}
                    </span>
                    {skill.description && (
                      <span
                        className="mt-1 block leading-4 text-text-muted"
                        data-testid={`battle_span_skill_tooltip_description_${getTestIdSegment(skill.id)}`}
                      >
                        {skill.description}
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function ActionWheel({
  actionSlots,
  onAddSkillToActionSlot,
  onInsertSkillAtActionSlot,
  onMoveActionSlot,
  onRemoveActionSlot,
  onSelectActionSlot,
  selectedActionSlotIndex,
  skills
}: {
  actionSlots: ActionSlot[];
  selectedActionSlotIndex: number;
  onAddSkillToActionSlot: (skill: SkillDefinition) => void;
  onInsertSkillAtActionSlot: (skill: SkillDefinition, targetSlotIndex: number) => void;
  onMoveActionSlot: (sourceSlotIndex: number, targetSlotIndex: number) => void;
  onRemoveActionSlot: (slotIndex: number) => void;
  onSelectActionSlot: (slotIndex: number) => void;
  skills: SkillDefinition[];
}) {
  const skillsById = useMemo(() => new Map(skills.map((skill) => [skill.id, skill])), [skills]);
  const handledActionSlotDragRef = useRef(false);

  function handleActionWheelDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();

    const sourceSlotIndex = getDraggedActionSlotIndex(event);

    if (sourceSlotIndex !== null && Number.isInteger(sourceSlotIndex)) {
      handledActionSlotDragRef.current = true;
      onRemoveActionSlot(sourceSlotIndex);
      return;
    }

    const skill = skillsById.get(event.dataTransfer.getData(skillDragDataType));

    if (skill) {
      onAddSkillToActionSlot(skill);
    }
  }

  function handleActionSlotDrop(event: DragEvent<HTMLButtonElement>, targetSlotIndex: number) {
    event.preventDefault();
    event.stopPropagation();

    const sourceSlotIndex = getDraggedActionSlotIndex(event);

    if (sourceSlotIndex !== null && Number.isInteger(sourceSlotIndex)) {
      handledActionSlotDragRef.current = true;
      onMoveActionSlot(sourceSlotIndex, targetSlotIndex);
      return;
    }

    const skill = skillsById.get(event.dataTransfer.getData(skillDragDataType));

    if (skill) {
      onInsertSkillAtActionSlot(skill, targetSlotIndex);
    }
  }

  return (
    <div className="grid w-full justify-items-center gap-2" data-testid="battle_div_action_bar">
      <div
        className="flex w-full items-center justify-between gap-3"
        data-testid="battle_div_action_bar_header"
      >
        <div
          className="text-xs font-black uppercase tracking-wide text-text-muted"
          data-testid="battle_div_action_bar_label"
        >
          Action Bar
        </div>
      </div>
      <div
        aria-label="Action wheel"
        data-testid="battle_div_action_wheel"
        className="relative aspect-square w-full max-w-[340px]"
        onDragOver={(event) => {
          event.preventDefault();
          event.dataTransfer.dropEffect = event.dataTransfer.types.includes(actionSlotDragDataType)
            ? "move"
            : "copy";
        }}
        onDrop={handleActionWheelDrop}
        role="group"
      >
        <div
          aria-hidden="true"
          className="absolute left-1/2 top-1/2 h-[75.5%] w-[75.5%] -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-[#2b2418] bg-[radial-gradient(circle,transparent_49%,rgba(255,225,115,0.13)_50%,rgba(255,225,115,0.08)_57%,transparent_58%),conic-gradient(from_270deg,rgba(255,225,115,0.12),rgba(0,0,0,0.28),rgba(255,225,115,0.12),rgba(0,0,0,0.28),rgba(255,225,115,0.12))] opacity-80 shadow-[inset_0_0_0_2px_rgba(255,255,255,0.08),inset_0_0_24px_rgba(0,0,0,0.76),0_0_18px_rgba(255,225,115,0.08)]"
          data-testid="battle_div_action_wheel_outer_ring"
        />
        <div
          aria-hidden="true"
          className="absolute left-1/2 top-1/2 h-[41.8%] w-[41.8%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[rgba(255,225,115,0.2)] bg-[radial-gradient(circle,rgba(255,225,115,0.1),rgba(0,0,0,0.14)_58%,transparent_62%)]"
          data-testid="battle_div_action_wheel_inner_ring"
        />
        {actionSlots.map((skill, index) => (
          <button
            aria-label={`Action slot ${index + 1}${skill ? `: ${skill.name}` : ""}`}
            aria-pressed={selectedActionSlotIndex === index}
            data-testid={`battle_button_action_slot_${index}`}
            className={cx(
              "absolute grid h-[22.7%] w-[22.7%] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-[3px] border-[#21190f] bg-[radial-gradient(circle_at_50%_42%,rgba(255,246,198,0.18),rgba(47,35,18,0.86)_42%,rgba(4,4,3,0.98)_72%)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.2),inset_0_-5px_8px_rgba(0,0,0,0.58),0_2px_0_rgba(0,0,0,0.66)] transition-transform focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ffe173]",
              skill &&
                "overflow-hidden border-[#6b5523] bg-[radial-gradient(circle_at_50%_42%,rgba(255,246,198,0.28),rgba(87,58,19,0.92)_42%,rgba(4,4,3,0.98)_72%)] after:pointer-events-none after:absolute after:inset-0 after:z-[3] after:rounded-full after:bg-[radial-gradient(circle,transparent_56%,rgba(4,4,3,0.2)_70%,rgba(4,4,3,0.76)_100%)]",
              selectedActionSlotIndex === index ? "scale-110 hover:scale-[1.18]" : "hover:scale-110"
            )}
            key={index}
            draggable={Boolean(skill)}
            onClick={(event) => {
              onSelectActionSlot(index);

              if (skill && event.detail > 0 && event.detail % 2 === 0) {
                onRemoveActionSlot(index);
              }
            }}
            onDragOver={(event) => {
              event.preventDefault();
              event.dataTransfer.dropEffect = event.dataTransfer.types.includes(actionSlotDragDataType)
                ? "move"
                : "copy";
            }}
            onDragStart={(event) => {
              if (!skill) {
                event.preventDefault();
                return;
              }

              handledActionSlotDragRef.current = false;
              event.dataTransfer.effectAllowed = "move";
              event.dataTransfer.setData(actionSlotDragDataType, String(index));
            }}
            onDragEnd={() => {
              if (skill && !handledActionSlotDragRef.current) {
                onRemoveActionSlot(index);
              }

              handledActionSlotDragRef.current = false;
            }}
            onDrop={(event) => handleActionSlotDrop(event, index)}
            style={actionSlotPositions[index]}
            title={skill?.name ?? `Action slot ${index + 1}`}
            type="button"
          >
            {skill ? (
              <span
                aria-hidden="true"
                className="relative z-[2] block h-[84%] w-[84%] overflow-hidden rounded-full bg-black shadow-[inset_0_0_10px_rgba(0,0,0,0.78),0_0_0_5px_rgba(255,231,141,0.88),0_0_8px_rgba(255,225,115,0.28)] after:pointer-events-none after:absolute after:inset-0 after:z-[3] after:rounded-full after:bg-[radial-gradient(circle,transparent_62%,rgba(4,4,3,0.18)_79%,rgba(4,4,3,0.62)_100%)]"
                data-testid={`battle_span_action_slot_icon_${index}`}
              >
                <Image
                  alt=""
                  aria-hidden="true"
                  className="absolute left-1/2 top-1/2 z-[1] h-[142%] w-[142%] -translate-x-1/2 -translate-y-1/2 object-cover blur-[4px]"
                  height={38}
                  src={getSkillIconSrc(skill)}
                  unoptimized
                  width={38}
                />
                <Image
                  alt=""
                  aria-hidden="true"
                  className="pointer-events-none absolute left-1/2 top-1/2 z-[2] h-[134%] w-[134%] -translate-x-1/2 -translate-y-1/2 object-cover"
                  height={38}
                  src={getSkillIconSrc(skill)}
                  style={{
                    WebkitMaskImage: "radial-gradient(circle, black 0 48%, transparent 72%)",
                    maskImage: "radial-gradient(circle, black 0 48%, transparent 72%)"
                  }}
                  unoptimized
                  width={38}
                />
              </span>
            ) : null}
          </button>
        ))}
        <div
          className="absolute left-1/2 top-1/2 grid h-[22.7%] w-[22.7%] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full"
          data-testid="battle_div_action_wheel_center"
        >
          <Image
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-contain"
            height={50}
            src="/images/ui/battle-slots/slot02.png"
            unoptimized
            width={50}
          />
          <Swords aria-hidden="true" className="relative text-[#d8c077]" size={20} />
        </div>
      </div>
    </div>
  );
}

function MonsterPanel({
  monsterFamily,
  monsterHp,
  selectedVariant
}: {
  monsterFamily: MapMonsterFamily | null;
  monsterHp: number;
  selectedVariant: MonsterFamilyVariant | null;
}) {
  return (
    <Panel as="section" className="content-start gap-4" data-testid="battle_panel_monster">
      <div className="flex items-start justify-between gap-3" data-testid="battle_div_monster_header">
        <SectionHeading
          eyebrow="Monster"
          testId="battle_heading_monster"
          title={monsterFamily?.name ?? "No target"}
        />
        {selectedVariant?.icon ? (
          <Image
            alt=""
            aria-hidden="true"
            className="h-14 w-14 object-contain drop-shadow-[0_2px_5px_rgba(0,0,0,0.72)]"
            height={56}
            src={getMonsterIconUrl(selectedVariant.icon)}
            unoptimized
            width={56}
          />
        ) : null}
      </div>
      <StatusBar
        label="HP"
        testIdPrefix="battle_monster"
        value={Math.round(monsterHp * 0.74)}
        max={monsterHp}
        tone="hp"
      />
      {selectedVariant ? (
        <div
          className="grid gap-2 rounded-control border border-[rgba(138,116,65,0.58)] bg-black/28 p-3 text-sm font-bold"
          data-testid="battle_div_monster_info"
        >
          <InfoRow label="Variant" value={selectedVariant.name} />
          <InfoRow label="Level" value={formatBattleValue(selectedVariant.level)} />
          <InfoRow label="Rank" value={formatBattleValue(selectedVariant.rank)} />
          <InfoRow label="Element" value={formatBattleValue(selectedVariant.element)} />
          <InfoRow
            label="Attack"
            value={`${formatBattleValue(selectedVariant.minAttack)} - ${formatBattleValue(selectedVariant.maxAttack)}`}
          />
          <InfoRow label="Defense" value={formatBattleValue(selectedVariant.defense)} />
          <InfoRow label="Magic DEF" value={formatBattleValue(selectedVariant.magicDefense)} />
          <InfoRow
            label="Penya"
            value={`${formatBattleValue(selectedVariant.minDropGold)} - ${formatBattleValue(selectedVariant.maxDropGold)}`}
          />
        </div>
      ) : (
        <MutedText data-testid="battle_p_no_monster_target">
          Select a monster from the map to prepare a battle target.
        </MutedText>
      )}
    </Panel>
  );
}

function MonsterSpecialBar({ selectedVariant }: { selectedVariant: MonsterFamilyVariant | null }) {
  const specials = [
    { label: "Heavy hit", ready: true },
    {
      label: "Element burst",
      ready: Boolean(selectedVariant?.element && selectedVariant.element !== "none")
    },
    { label: "Enrage", ready: selectedVariant?.variantRank === "giant" }
  ];

  return (
    <div className="grid grid-cols-3 gap-2" data-testid="battle_div_monster_specials">
      {specials.map((special) => (
        <div
          className={cx(
            "relative grid aspect-square place-items-center rounded-full border-[3px] border-[#21190f] bg-[radial-gradient(circle_at_50%_42%,rgba(255,246,198,0.16),rgba(47,35,18,0.82)_42%,rgba(4,4,3,0.98)_72%)] text-center text-[0.62rem] font-black uppercase leading-tight shadow-[inset_0_0_0_1px_rgba(255,255,255,0.18),inset_0_-5px_8px_rgba(0,0,0,0.58),0_2px_0_rgba(0,0,0,0.66)]",
            special.ready ? "border-[#6b5523] text-[#ffe173]" : "text-text-muted opacity-70"
          )}
          data-testid={`battle_div_monster_special_${getTestIdSegment(special.label)}`}
          key={special.label}
          title={special.label}
        >
          <span
            className="relative px-1"
            data-testid={`battle_span_monster_special_${getTestIdSegment(special.label)}`}
          >
            {special.label}
          </span>
        </div>
      ))}
    </div>
  );
}

function CombatantBadge({
  align = "left",
  label,
  value
}: {
  align?: "left" | "right";
  label: string;
  value: string;
}) {
  return (
    <div
      className={cx(
        "grid gap-1 rounded-control border border-border bg-black/35 p-3",
        align === "right" && "text-right"
      )}
      data-testid={`battle_div_combatant_${getTestIdSegment(label)}`}
    >
      <strong
        className="truncate text-sm"
        data-testid={`battle_strong_combatant_label_${getTestIdSegment(label)}`}
      >
        {label}
      </strong>
      <span
        className="text-xs font-black uppercase tracking-wide text-text-muted"
        data-testid={`battle_span_combatant_value_${getTestIdSegment(label)}`}
      >
        {value}
      </span>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="grid grid-cols-[88px_1fr] gap-2"
      data-testid={`battle_div_info_row_${getTestIdSegment(label)}`}
    >
      <span className="text-text-muted" data-testid={`battle_span_info_label_${getTestIdSegment(label)}`}>
        {label}
      </span>
      <strong
        className="min-w-0 truncate text-right"
        data-testid={`battle_strong_info_value_${getTestIdSegment(label)}`}
      >
        {value}
      </strong>
    </div>
  );
}
