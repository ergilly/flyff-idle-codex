"use client";

import Image from "next/image";
import { Swords } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import { Button } from "@/components/atoms/Button";
import { MutedText } from "@/components/atoms/MutedText";
import { Panel } from "@/components/atoms/Panel";
import { CharacterEquipmentPanel } from "@/components/molecules/main-application/CharacterEquipmentPanel";
import { SectionHeading } from "@/components/molecules/main-application/SectionHeading";
import {
  getItemIconUrl,
  getMonsterIconUrl,
  type Character,
  type CharacterEquipmentSlot,
  type ItemMetadata,
  type MapMonsterFamily,
  type MonsterFamilyVariant
} from "@/lib/api";
import { cx } from "@/lib/classNames";
import {
  getAutoAttackDamage,
  getAutoAttackTiming,
  getCombatStats,
  type AttackTiming,
  type AutoAttackDamage,
  type CombatStat
} from "@/lib/combatStats";
import {
  getUnlockedSkills,
  type SkillCombo,
  type SkillDefinition,
  type SkillTreeTab
} from "@/lib/skillTrees";
import { getTestIdSegment } from "@/lib/testIds";

type ActionSlot = SkillDefinition | null;

type BattlePageProps = {
  character: Character;
  itemsById: Record<string, ItemMetadata>;
  onClearMonsterTarget?: () => void;
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
const dropRarityTextClassByName: Record<string, string> = {
  common: "text-[#5fb3ff]",
  uncommon: "text-[#64d875]",
  rare: "text-[#f5d451]",
  veryrare: "text-[#ff6464]",
  unique: "text-[#c27bff]"
};
const dropRarityBorderClassByName: Record<string, string> = {
  common: "border-[#5fb3ff]/45",
  uncommon: "border-[#64d875]/50",
  rare: "border-[#f5d451]/55",
  veryrare: "border-[#ff6464]/55",
  unique: "border-[#c27bff]/55"
};
const dropCategoryOrder = [
  "weapon",
  "armor",
  "jewelry",
  "upgradeMaterial",
  "consumable",
  "fashion",
  "flying",
  "other"
] as const;
const dropCategoryLabels: Record<(typeof dropCategoryOrder)[number], string> = {
  armor: "Armor",
  consumable: "Consumables",
  fashion: "Fashion",
  flying: "Flying",
  jewelry: "Jewelry",
  other: "Other",
  upgradeMaterial: "Upgrade Materials",
  weapon: "Weapons"
};

function getSkillIconSrc(skill: SkillDefinition) {
  return `https://api.flyff.com/image/skill/colored/${skill.icon}`;
}

function formatBattleValue(value: number | string | null | undefined) {
  return value === null || value === undefined ? "Unknown" : String(value);
}

function getDropRarityTextClass(rarity: string | null | undefined) {
  return dropRarityTextClassByName[rarity?.toLowerCase() ?? "common"] ?? dropRarityTextClassByName.common;
}

function getDropRarityBorderClass(rarity: string | null | undefined) {
  return dropRarityBorderClassByName[rarity?.toLowerCase() ?? "common"] ?? dropRarityBorderClassByName.common;
}

function isQuestDropItem(item: ItemMetadata | undefined) {
  const category = item?.category?.toLowerCase() ?? "";
  const subcategory = item?.subcategory?.toLowerCase() ?? "";

  return category === "booty" || category.includes("quest") || subcategory.includes("quest");
}

function getDropCategory(item: ItemMetadata | undefined): (typeof dropCategoryOrder)[number] {
  const category = item?.category?.toLowerCase() ?? "";
  const subcategory = item?.subcategory?.toLowerCase() ?? "";

  if (item?.consumable) {
    return "consumable";
  }

  if (category === "weapon") {
    return "weapon";
  }

  if (category === "armor") {
    return "armor";
  }

  if (["accessory", "jewelry", "jewelery"].includes(category)) {
    return "jewelry";
  }

  if (
    ["upgrade", "material", "materials"].includes(category) ||
    subcategory.includes("upgrade") ||
    subcategory.includes("material") ||
    subcategory.includes("sunstone") ||
    subcategory.includes("moonstone")
  ) {
    return "upgradeMaterial";
  }

  if (
    [
      "food",
      "potion",
      "potions",
      "recovery",
      "refresher",
      "refreshers",
      "pill",
      "pills",
      "scroll",
      "scrolls",
      "consumable",
      "consumables"
    ].includes(category) ||
    [
      "food",
      "potion",
      "potions",
      "recovery",
      "refresher",
      "refreshers",
      "pill",
      "pills",
      "scroll",
      "scrolls"
    ].some((term) => subcategory.includes(term))
  ) {
    return "consumable";
  }

  if (category === "fashion") {
    return "fashion";
  }

  if (category === "flying") {
    return "flying";
  }

  return "other";
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

export function BattlePage({
  character,
  itemsById,
  onClearMonsterTarget,
  selectedMonsterFamily,
  skillTabs
}: BattlePageProps) {
  const unlockedSkills = useMemo(() => getUnlockedSkills(skillTabs), [skillTabs]);
  const usableSkills = unlockedSkills.filter((skill) => (character.skillLevels[skill.id] ?? 0) > 0);
  const listedSkills = usableSkills.length > 0 ? usableSkills : unlockedSkills.slice(0, 8);
  const [activeCharacterTab, setActiveCharacterTab] = useState<CharacterPanelTab>("equipment");
  const [activeEquipmentSet, setActiveEquipmentSet] = useState(0);
  const [selectedEquipmentSlot, setSelectedEquipmentSlot] = useState<CharacterEquipmentSlot | null>(null);
  const [selectedActionSlotIndex, setSelectedActionSlotIndex] = useState(actionSlotFillOrder[0]);
  const [isCombatInProgress, setIsCombatInProgress] = useState(false);
  const [actionSlots, setActionSlots] = useState<ActionSlot[]>(() =>
    Array.from({ length: actionSlotPositions.length }, () => null)
  );
  const selectedVariant =
    selectedMonsterFamily?.variants.find((variant) => variant.variantRank === "normal") ??
    selectedMonsterFamily?.variants[0] ??
    null;
  const combatStats = getCombatStats(character, itemsById, activeEquipmentSet);
  const characterAttackTiming = getAutoAttackTiming(character, combatStats);
  const characterHp = getCombatStatNumber(combatStats, "Max HP");
  const characterFp = getCombatStatNumber(combatStats, "Max FP");
  const characterMp = getCombatStatNumber(combatStats, "Max MP");
  const monsterHp = selectedVariant?.hp ?? null;
  const monsterAttack = selectedVariant ? getVariantPower(selectedVariant) : null;
  const autoAttackDamage = selectedVariant
    ? getAutoAttackDamage(character, itemsById, selectedVariant, activeEquipmentSet)
    : null;

  useEffect(() => {
    setSelectedEquipmentSlot(null);
  }, [activeEquipmentSet]);

  useEffect(() => {
    setIsCombatInProgress(false);
  }, [selectedMonsterFamily]);

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

  function handleRunAway() {
    setIsCombatInProgress(false);
    onClearMonsterTarget?.();
  }

  return (
    <section
      className="grid h-full min-h-0 items-stretch gap-4 xl:grid-cols-2"
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
        characterAttackTiming={characterAttackTiming}
        combatStats={combatStats}
        isCombatInProgress={isCombatInProgress}
        itemsById={itemsById}
        onAddSkillToActionSlot={addSkillToFirstAvailableSlot}
        onInsertSkillAtActionSlot={insertSkillAtActionSlot}
        onMoveActionSlot={moveActionSlot}
        onRemoveActionSlot={removeActionSlot}
        onSelectActionSlot={setSelectedActionSlotIndex}
        onSelectEquipmentSlot={setSelectedEquipmentSlot}
        onSelectEquipmentSet={setActiveEquipmentSet}
        onTabChange={setActiveCharacterTab}
        selectedActionSlotIndex={selectedActionSlotIndex}
        selectedEquipmentSlot={selectedEquipmentSlot}
        skillTabs={skillTabs}
        skills={listedSkills}
      />

      <MonsterPanel
        itemsById={itemsById}
        autoAttackDamage={autoAttackDamage}
        monsterAttack={monsterAttack}
        isCombatInProgress={isCombatInProgress}
        monsterFamily={selectedMonsterFamily}
        monsterHp={monsterHp}
        onRunAway={handleRunAway}
        onStartCombat={() => setIsCombatInProgress(true)}
        selectedVariant={selectedVariant}
      />
    </section>
  );
}

function CharacterCombatPanel({
  actionSlots,
  activeEquipmentSet,
  activeTab,
  character,
  characterAttackTiming,
  characterFp,
  characterHp,
  characterMp,
  combatStats,
  isCombatInProgress,
  itemsById,
  onMoveActionSlot,
  onRemoveActionSlot,
  onSelectActionSlot,
  onSelectEquipmentSlot,
  onSelectEquipmentSet,
  onTabChange,
  onAddSkillToActionSlot,
  selectedActionSlotIndex,
  selectedEquipmentSlot,
  onInsertSkillAtActionSlot,
  skillTabs,
  skills
}: {
  actionSlots: ActionSlot[];
  activeEquipmentSet: number;
  activeTab: CharacterPanelTab;
  character: Character;
  characterAttackTiming: AttackTiming;
  characterFp: number;
  characterHp: number;
  characterMp: number;
  combatStats: CombatStat[];
  isCombatInProgress: boolean;
  itemsById: Record<string, ItemMetadata>;
  onAddSkillToActionSlot: (skill: SkillDefinition) => void;
  onInsertSkillAtActionSlot: (skill: SkillDefinition, targetSlotIndex: number) => void;
  onMoveActionSlot: (sourceSlotIndex: number, targetSlotIndex: number) => void;
  onRemoveActionSlot: (slotIndex: number) => void;
  onSelectActionSlot: (slotIndex: number) => void;
  onSelectEquipmentSlot: (slot: CharacterEquipmentSlot) => void;
  onSelectEquipmentSet: (setIndex: number) => void;
  onTabChange: (tab: CharacterPanelTab) => void;
  selectedActionSlotIndex: number;
  selectedEquipmentSlot: CharacterEquipmentSlot | null;
  skillTabs: SkillTreeTab[];
  skills: SkillDefinition[];
}) {
  return (
    <Panel as="section" className="h-full min-h-0 content-start gap-4" data-testid="battle_panel_character">
      <CharacterCombatHeader
        attackTiming={characterAttackTiming}
        characterFp={characterFp}
        characterHp={characterHp}
        characterMp={characterMp}
        isCombatInProgress={isCombatInProgress}
      />
      <div className="grid min-h-0 items-start gap-4 lg:grid-cols-2">
        <div className="grid min-w-0 content-start gap-4" data-testid="battle_div_character_control_column">
          <FoodPanel />
          <CharacterBattleTabs activeTab={activeTab} onTabChange={onTabChange} />
          <Panel
            as="section"
            className="content-start gap-4 [&_[data-testid='equipment_div_content']]:justify-center [&_[data-testid='equipment_div_layout']]:!max-w-[190px]"
            data-testid="battle_panel_character_loadout"
          >
            {activeTab === "equipment" ? (
              <BattleEquipmentPanel
                activeEquipmentSet={activeEquipmentSet}
                character={character}
                itemsById={itemsById}
                onSelectEquipmentSlot={onSelectEquipmentSlot}
                onSelectEquipmentSet={onSelectEquipmentSet}
                selectedEquipmentSlot={selectedEquipmentSlot}
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
        </div>
        <CharacterStatsPanel combatStats={combatStats} />
      </div>
    </Panel>
  );
}

function CharacterCombatHeader({
  attackTiming,
  characterFp,
  characterHp,
  characterMp,
  isCombatInProgress
}: {
  attackTiming: AttackTiming;
  characterFp: number;
  characterHp: number;
  characterMp: number;
  isCombatInProgress: boolean;
}) {
  return (
    <div
      className="grid min-h-[98px] min-w-0 gap-4 rounded-control border border-border bg-black/35 p-3 min-[720px]:grid-cols-2 min-[720px]:items-center"
      data-testid="battle_div_character_combat_header"
    >
      <div className="grid gap-0" data-testid="battle_div_character_header_resources">
        <StatusBar
          label="HP"
          testIdPrefix="battle_character_header"
          value={characterHp}
          max={characterHp}
          tone="hp"
        />
        <StatusBar
          label="MP"
          testIdPrefix="battle_character_header"
          value={characterMp}
          max={characterMp}
          tone="mp"
        />
        <StatusBar
          label="FP"
          testIdPrefix="battle_character_header"
          value={characterFp}
          max={characterFp}
          tone="fp"
        />
      </div>
      <div className="grid h-full items-center" data-testid="battle_div_character_header_attack">
        <AttackTimeline
          attackIntervalSeconds={attackTiming.secondsPerAttack}
          isActive={isCombatInProgress}
          label="Player attack"
        />
      </div>
    </div>
  );
}

function FoodPanel() {
  return (
    <Panel as="section" className="min-w-0 content-start gap-3" data-testid="battle_panel_food">
      <SectionHeading eyebrow="Food" testId="battle_heading_food" title="Recovery" />
      <div
        className="grid min-h-[72px] place-items-center rounded-control border border-dashed border-[rgba(138,116,65,0.64)] bg-black/24 p-3 text-center text-sm font-bold text-text-muted"
        data-testid="battle_div_food_empty"
      >
        No food selected
      </div>
    </Panel>
  );
}

function CharacterBattleTabs({
  activeTab,
  onTabChange
}: {
  activeTab: CharacterPanelTab;
  onTabChange: (tab: CharacterPanelTab) => void;
}) {
  return (
    <Panel as="section" className="min-w-0 content-start gap-3" data-testid="battle_panel_character_menu">
      <SectionHeading eyebrow="Menu" testId="battle_heading_character_menu" title="Loadout" />
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
    </Panel>
  );
}

function CharacterStatsPanel({ combatStats }: { combatStats: CombatStat[] }) {
  const statsByLabel = new Map(combatStats.map((stat) => [stat.label, stat]));
  const statGroups = [
    {
      title: "Attributes",
      labels: ["STR", "STA", "DEX", "INT"]
    },
    {
      title: "Resources",
      labels: ["Max HP", "Max MP", "Max FP"]
    },
    {
      title: "Offense",
      labels: ["Attack", "Magic Attack", "PvE Damage", "Critical Chance", "Critical Damage"]
    },
    {
      title: "Speed & Accuracy",
      labels: ["Attack Speed", "DCT", "Hit Rate"]
    },
    {
      title: "Defense",
      labels: ["Defense", "Magic DEF", "Critical Resist", "Melee Block", "Ranged Block", "Parry"]
    },
    {
      title: "Recovery",
      labels: ["Reflect Damage", "HP Recovery After Kill", "MP Recovery After Kill"]
    }
  ].map((group) => ({
    ...group,
    stats: group.labels
      .map((label) => statsByLabel.get(label))
      .filter((stat): stat is CombatStat => Boolean(stat))
  }));

  return (
    <Panel as="section" className="min-w-0 content-start gap-4" data-testid="battle_panel_character_stats">
      <SectionHeading eyebrow="Stats" testId="battle_heading_character_stats" title="Character" />
      <div
        className="grid gap-2 text-sm font-bold min-[520px]:grid-cols-2 lg:grid-cols-1 2xl:grid-cols-2"
        data-testid="battle_div_character_stats"
      >
        {statGroups.map((group) =>
          group.stats.length > 0 ? (
            <div
              className="grid content-start gap-1.5 rounded-control border border-[rgba(138,116,65,0.58)] bg-black/24 p-2.5"
              data-testid={`battle_div_character_stats_group_${getTestIdSegment(group.title)}`}
              key={group.title}
            >
              <h3
                className="text-[0.68rem] font-black uppercase tracking-wide text-text-muted"
                data-testid={`battle_heading_character_stats_group_${getTestIdSegment(group.title)}`}
              >
                {group.title}
              </h3>
              <div
                className="grid gap-1.5"
                data-testid={`battle_div_character_stats_group_rows_${getTestIdSegment(group.title)}`}
              >
                {group.stats.map((stat) => (
                  <InfoRow key={stat.label} label={stat.label} value={stat.value} />
                ))}
              </div>
            </div>
          ) : null
        )}
      </div>
    </Panel>
  );
}

function getCombatStatNumber(combatStats: CombatStat[], label: string) {
  const stat = combatStats.find((entry) => entry.label === label);
  const value = Number(stat?.value.replace(/,/g, ""));

  return Number.isFinite(value) ? value : 0;
}

function BattleEquipmentPanel({
  activeEquipmentSet,
  character,
  itemsById,
  onSelectEquipmentSlot,
  onSelectEquipmentSet,
  selectedEquipmentSlot
}: {
  activeEquipmentSet: number;
  character: Character;
  itemsById: Record<string, ItemMetadata>;
  onSelectEquipmentSlot: (slot: CharacterEquipmentSlot) => void;
  onSelectEquipmentSet: (setIndex: number) => void;
  selectedEquipmentSlot: CharacterEquipmentSlot | null;
}) {
  return (
    <CharacterEquipmentPanel
      activeEquipmentSet={activeEquipmentSet}
      character={character}
      itemsById={itemsById}
      onEquipmentSetChange={onSelectEquipmentSet}
      onSelectEquipmentSlot={onSelectEquipmentSlot}
      selectedEquipmentSlot={selectedEquipmentSlot}
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
    fp: "from-[#5fe07a] to-[#18803b]",
    mp: "from-[#4f91ff] to-[#17459b]"
  }[tone];
  const testId = `${testIdPrefix}_${getTestIdSegment(label)}`;

  return (
    <div className="grid" data-testid={`${testId}_div_status`}>
      <div
        className="relative h-6 overflow-hidden rounded-[4px] border border-border bg-black/55 shadow-[inset_0_2px_6px_rgba(0,0,0,0.72)]"
        data-testid={`${testId}_div_status_track`}
      >
        <div
          className={cx("h-full bg-gradient-to-r shadow-[inset_0_1px_0_rgba(255,255,255,0.32)]", toneClass)}
          data-testid={`${testId}_div_status_fill`}
          style={{ width: `${percent}%` }}
        />
        <div
          className="absolute inset-0 flex items-center justify-between gap-2 px-2 text-[0.7rem] font-black uppercase tracking-wide text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.16)] [text-shadow:0_1px_2px_rgba(0,0,0,0.9)]"
          data-testid={`${testId}_div_status_header`}
        >
          <span data-testid={`${testId}_span_status_label`}>{label}</span>
          <span data-testid={`${testId}_span_status_value`}>
            {value} / {max}
          </span>
        </div>
      </div>
    </div>
  );
}

function AttackTimeline({
  attackIntervalSeconds,
  isActive,
  label,
  tone = "primary"
}: {
  attackIntervalSeconds: number;
  isActive: boolean;
  label: string;
  tone?: "primary" | "danger";
}) {
  const animationDuration = Math.max(0.1, attackIntervalSeconds);
  const fillStyle = isActive
    ? {
        animation: `battle-attack-fill ${animationDuration}s linear infinite`
      }
    : {
        transform: "scaleX(0)"
      };

  return (
    <div className="relative h-[72px]" data-testid={`battle_div_timeline_${getTestIdSegment(label)}`}>
      <style jsx global>{`
        @keyframes battle-attack-fill {
          from {
            transform: scaleX(0);
          }

          to {
            transform: scaleX(1);
          }
        }
      `}</style>
      <div className="sr-only" data-testid={`battle_div_timeline_header_${getTestIdSegment(label)}`}>
        <span data-testid={`battle_span_timeline_label_${getTestIdSegment(label)}`}>{label}</span>
      </div>
      <div
        className="absolute left-0 right-0 top-1/2 h-4 -translate-y-1/2 overflow-hidden rounded-[999px] border border-border bg-black/55"
        data-testid={`battle_div_timeline_track_${getTestIdSegment(label)}`}
      >
        <div
          className={cx(
            "h-full origin-left rounded-[999px]",
            tone === "danger"
              ? "bg-gradient-to-r from-[#ff7b58] to-[#c82c2c]"
              : "bg-gradient-to-r from-[#ffe173] to-[#d88f2e]"
          )}
          data-testid={`battle_div_timeline_fill_${getTestIdSegment(label)}`}
          style={fillStyle}
        />
      </div>
      <div
        className="absolute left-0 right-0 top-[calc(50%+12px)] text-right text-[0.68rem] font-black uppercase tracking-wide text-text-muted"
        data-testid={`battle_div_timeline_speed_${getTestIdSegment(label)}`}
      >
        Attack every {attackIntervalSeconds.toFixed(1)}s
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
    <div className="grid w-full justify-items-center gap-1.5" data-testid="battle_div_action_bar">
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
        className="relative aspect-square w-full max-w-[280px]"
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
  autoAttackDamage,
  isCombatInProgress,
  itemsById,
  monsterAttack,
  monsterFamily,
  monsterHp,
  onRunAway,
  onStartCombat,
  selectedVariant
}: {
  autoAttackDamage: AutoAttackDamage | null;
  isCombatInProgress: boolean;
  itemsById: Record<string, ItemMetadata>;
  monsterAttack: number | null;
  monsterFamily: MapMonsterFamily | null;
  monsterHp: number | null;
  onRunAway: () => void;
  onStartCombat: () => void;
  selectedVariant: MonsterFamilyVariant | null;
}) {
  const [isDropsOverlayOpen, setIsDropsOverlayOpen] = useState(false);

  return (
    <Panel as="section" className="h-full min-h-0 content-start gap-4" data-testid="battle_panel_monster">
      <MonsterCombatHeader isCombatInProgress={isCombatInProgress} monsterHp={monsterHp} />
      <MonsterBasicPanel monsterFamily={monsterFamily} selectedVariant={selectedVariant} />
      <MonsterStatsAndOptionsPanel
        autoAttackDamage={autoAttackDamage}
        isCombatInProgress={isCombatInProgress}
        monsterAttack={monsterAttack}
        onRunAway={onRunAway}
        onStartCombat={onStartCombat}
        onViewDrops={() => setIsDropsOverlayOpen(true)}
        selectedVariant={selectedVariant}
      />
      <MonsterLootBox />
      {isDropsOverlayOpen ? (
        <MonsterDropsOverlay
          itemsById={itemsById}
          monsterFamily={monsterFamily}
          onClose={() => setIsDropsOverlayOpen(false)}
          selectedVariant={selectedVariant}
        />
      ) : null}
    </Panel>
  );
}

function MonsterCombatHeader({
  isCombatInProgress,
  monsterHp
}: {
  isCombatInProgress: boolean;
  monsterHp: number | null;
}) {
  return (
    <div
      className="grid min-h-[98px] gap-4 rounded-control border border-border bg-black/35 p-3 min-[560px]:grid-cols-2 min-[560px]:items-center"
      data-testid="battle_div_monster_combat_header"
    >
      <AttackTimeline
        attackIntervalSeconds={2.4}
        isActive={isCombatInProgress}
        label="Monster attack"
        tone="danger"
      />
      {monsterHp !== null ? (
        <StatusBar
          label="HP"
          testIdPrefix="battle_monster_header"
          value={Math.round(monsterHp * 0.74)}
          max={monsterHp}
          tone="hp"
        />
      ) : (
        <div
          className="grid h-6 place-items-center rounded-[4px] border border-border bg-black/55 px-2 text-[0.7rem] font-black uppercase tracking-wide text-text-muted"
          data-testid="battle_monster_header_no_target"
        >
          No target
        </div>
      )}
    </div>
  );
}

function MonsterBasicPanel({
  monsterFamily,
  selectedVariant
}: {
  monsterFamily: MapMonsterFamily | null;
  selectedVariant: MonsterFamilyVariant | null;
}) {
  return (
    <Panel as="section" className="content-start gap-4" data-testid="battle_panel_monster_basic">
      <SectionHeading
        eyebrow="Target"
        testId="battle_heading_monster_basic"
        title={monsterFamily?.name ?? "No target"}
      />
      <div className="grid gap-4 min-[560px]:grid-cols-[96px_1fr] min-[560px]:items-start">
        {selectedVariant?.icon ? (
          <div
            className="grid aspect-square place-items-center rounded-control border border-[rgba(138,116,65,0.58)] bg-black/32 p-3"
            data-testid="battle_div_monster_image"
          >
            <Image
              alt=""
              aria-hidden="true"
              className="h-full w-full object-contain drop-shadow-[0_2px_5px_rgba(0,0,0,0.72)]"
              height={96}
              src={getMonsterIconUrl(selectedVariant.icon)}
              unoptimized
              width={96}
            />
          </div>
        ) : (
          <div
            className="grid aspect-square place-items-center rounded-control border border-dashed border-[rgba(138,116,65,0.64)] bg-black/24 text-xs font-black uppercase text-text-muted"
            data-testid="battle_div_monster_image_empty"
          >
            No target
          </div>
        )}
        {selectedVariant ? (
          <div className="grid gap-2 text-sm font-bold" data-testid="battle_div_monster_info">
            <InfoRow label="Variant" value={selectedVariant.name} />
            <InfoRow label="Level" value={formatBattleValue(selectedVariant.level)} />
            <InfoRow label="Rank" value={formatBattleValue(selectedVariant.rank)} />
            <InfoRow label="Element" value={formatBattleValue(selectedVariant.element)} />
          </div>
        ) : (
          <MutedText data-testid="battle_p_no_monster_target">
            Select a monster from the map to prepare a battle target.
          </MutedText>
        )}
      </div>
    </Panel>
  );
}

function MonsterStatsAndOptionsPanel({
  autoAttackDamage,
  isCombatInProgress,
  monsterAttack,
  onRunAway,
  onStartCombat,
  onViewDrops,
  selectedVariant
}: {
  autoAttackDamage: AutoAttackDamage | null;
  isCombatInProgress: boolean;
  monsterAttack: number | null;
  onRunAway: () => void;
  onStartCombat: () => void;
  onViewDrops: () => void;
  selectedVariant: MonsterFamilyVariant | null;
}) {
  return (
    <Panel as="section" className="content-start gap-4" data-testid="battle_panel_monster_stats">
      <SectionHeading eyebrow="Stats" testId="battle_heading_monster_stats" title="Monster" />
      {selectedVariant ? (
        <div className="grid gap-3 min-[900px]:grid-cols-3" data-testid="battle_div_monster_more_stats">
          <div
            className="grid content-start gap-2 rounded-control border border-[rgba(138,116,65,0.58)] bg-black/24 p-3 text-sm font-bold"
            data-testid="battle_div_monster_offensive_stats"
          >
            <h3
              className="text-[0.68rem] font-black uppercase tracking-wide text-text-muted"
              data-testid="battle_heading_monster_offensive_stats"
            >
              Offensive Stats
            </h3>
            <InfoRow label="Attack" value={String(monsterAttack || "?")} />
            <InfoRow
              label="Damage"
              value={`${formatBattleValue(selectedVariant.minAttack)} - ${formatBattleValue(selectedVariant.maxAttack)}`}
            />
            {autoAttackDamage ? (
              <>
                <InfoRow label="Player Damage" value={formatBattleValue(autoAttackDamage.averageDamage)} />
                <InfoRow
                  label="Player DPS"
                  value={formatBattleValue(Math.round(autoAttackDamage.damagePerSecond))}
                />
                <InfoRow
                  label="Hit Chance"
                  value={`${autoAttackDamage.effectiveHitRate.toFixed(0)}%`}
                />
                <InfoRow
                  label="Time To Kill"
                  value={
                    autoAttackDamage.secondsToKill === null
                      ? "Unknown"
                      : `${autoAttackDamage.secondsToKill.toFixed(1)}s`
                  }
                />
              </>
            ) : null}
          </div>
          <div
            className="grid content-start gap-2 rounded-control border border-[rgba(138,116,65,0.58)] bg-black/24 p-3 text-sm font-bold"
            data-testid="battle_div_monster_defensive_stats"
          >
            <h3
              className="text-[0.68rem] font-black uppercase tracking-wide text-text-muted"
              data-testid="battle_heading_monster_defensive_stats"
            >
              Defensive Stats
            </h3>
            <InfoRow label="Defense" value={formatBattleValue(selectedVariant.defense)} />
            <InfoRow label="Magic DEF" value={formatBattleValue(selectedVariant.magicDefense)} />
          </div>
          <MonsterCombatOptions
            isCombatInProgress={isCombatInProgress}
            onRunAway={onRunAway}
            onStartCombat={onStartCombat}
            onViewDrops={onViewDrops}
            selectedVariant={selectedVariant}
          />
        </div>
      ) : (
        <div className="grid gap-3 min-[900px]:grid-cols-3" data-testid="battle_div_monster_more_stats">
          <MutedText data-testid="battle_p_no_monster_stats">No monster stats are available yet.</MutedText>
        </div>
      )}
    </Panel>
  );
}

function MonsterCombatOptions({
  isCombatInProgress,
  onRunAway,
  onStartCombat,
  onViewDrops,
  selectedVariant
}: {
  isCombatInProgress: boolean;
  onRunAway: () => void;
  onStartCombat: () => void;
  onViewDrops: () => void;
  selectedVariant: MonsterFamilyVariant | null;
}) {
  return (
    <div
      className="grid content-start gap-3 rounded-control border border-[rgba(138,116,65,0.58)] bg-black/24 p-3"
      data-testid="battle_div_monster_combat_options"
    >
      <h3
        className="text-[0.68rem] font-black uppercase tracking-wide text-text-muted"
        data-testid="battle_heading_monster_combat_options"
      >
        Combat Options
      </h3>
      <div className="grid gap-2" data-testid="battle_div_monster_combat_buttons">
        {isCombatInProgress ? (
          <Button data-testid="battle_button_run_away" onClick={onRunAway} type="button" variant="secondary">
            Run away
          </Button>
        ) : (
          <Button
            data-testid="battle_button_start_combat"
            disabled={!selectedVariant}
            onClick={onStartCombat}
            type="button"
          >
            Start combat
          </Button>
        )}
        <Button
          data-testid="battle_button_view_monster_drops"
          onClick={onViewDrops}
          type="button"
          variant="secondary"
        >
          View monster drops
        </Button>
      </div>
    </div>
  );
}

function MonsterLootBox() {
  return (
    <Panel as="section" className="content-start gap-3" data-testid="battle_panel_monster_loot_box">
      <SectionHeading eyebrow="Loot" testId="battle_heading_monster_loot_box" title="Loot Box" />
      <div
        className="grid min-h-[104px] place-items-center rounded-control border border-dashed border-[rgba(138,116,65,0.62)] bg-black/24 p-3"
        data-testid="battle_div_monster_loot_box_inventory"
      >
        <MutedText data-testid="battle_p_monster_loot_box_empty">No loot collected yet.</MutedText>
      </div>
    </Panel>
  );
}

function MonsterDropsOverlay({
  itemsById,
  monsterFamily,
  onClose,
  selectedVariant
}: {
  itemsById: Record<string, ItemMetadata>;
  monsterFamily: MapMonsterFamily | null;
  onClose: () => void;
  selectedVariant: MonsterFamilyVariant | null;
}) {
  const [collapsedDropSections, setCollapsedDropSections] = useState<Set<string>>(() => new Set());
  const drops = selectedVariant?.drops ?? [];
  const explicitQuestDrops = monsterFamily?.questDrops ?? [];
  const questDropsById = new Map(explicitQuestDrops.map((drop) => [String(drop.id), drop]));

  drops.forEach((drop) => {
    const item = itemsById[String(drop.item)];

    if (isQuestDropItem(item) && !questDropsById.has(String(drop.item))) {
      questDropsById.set(String(drop.item), {
        id: drop.item,
        icon: item?.icon ?? null,
        name: item?.name ?? `Item ${drop.item}`
      });
    }
  });

  const questDrops = Array.from(questDropsById.values());
  const questDropItemIds = new Set(questDrops.map((drop) => String(drop.id)));
  const regularDrops = drops.filter((drop) => !questDropItemIds.has(String(drop.item)));
  const groupedRegularDrops = dropCategoryOrder
    .map((category) => ({
      category,
      drops: regularDrops.filter((drop) => getDropCategory(itemsById[String(drop.item)]) === category),
      label: dropCategoryLabels[category]
    }))
    .filter((group) => group.drops.length > 0);
  const goldRange = selectedVariant
    ? `${formatBattleValue(selectedVariant.minDropGold)} - ${formatBattleValue(selectedVariant.maxDropGold)}`
    : "Unknown";

  function isDropSectionCollapsed(sectionId: string) {
    return collapsedDropSections.has(sectionId);
  }

  function toggleDropSection(sectionId: string) {
    setCollapsedDropSections((current) => {
      const next = new Set(current);

      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }

      return next;
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/72 p-4"
      data-testid="battle_div_monster_drops_overlay"
      role="dialog"
      aria-modal="true"
      aria-label={`Monster drops: ${selectedVariant?.name ?? "No target"}`}
    >
      <div className="grid w-full max-w-[420px] gap-4 rounded-card border-2 border-[rgba(226,179,63,0.58)] bg-[linear-gradient(180deg,rgba(31,29,22,0.98),rgba(5,6,5,0.98))] p-4 shadow-[0_18px_38px_rgba(0,0,0,0.46)]">
        <div className="flex items-start justify-between gap-3">
          <SectionHeading
            eyebrow="Drops"
            testId="battle_heading_monster_drops_overlay"
            title={selectedVariant?.name ?? "No target"}
          />
          <Button
            className="min-h-9 px-3 text-sm"
            data-testid="battle_button_close_monster_drops"
            onClick={onClose}
            type="button"
            variant="secondary"
          >
            Close
          </Button>
        </div>
        <div className="grid gap-2 text-sm font-bold" data-testid="battle_div_monster_drops_summary">
          <InfoRow label="Penya" value={goldRange} />
          {questDrops.map((questDrop, index) => {
            const item = itemsById[String(questDrop.id)];

            return (
              <div
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3"
                data-testid={`battle_div_monster_quest_drop_${index}`}
                key={`${questDrop.id}-${index}`}
              >
                <span
                  className="text-text-muted"
                  data-testid={`battle_span_monster_quest_drop_label_${index}`}
                >
                  Quest Item
                </span>
                <span className="grid min-w-0 grid-cols-[minmax(0,auto)_36px] items-center justify-end gap-2">
                  <strong
                    className="min-w-0 truncate text-right !text-sm"
                    data-testid={`battle_strong_monster_quest_drop_name_${index}`}
                  >
                    {item?.name ?? questDrop.name}
                  </strong>
                  <SmallDropItemImage
                    icon={item?.icon ?? questDrop.icon}
                    name={item?.name ?? questDrop.name}
                  />
                </span>
              </div>
            );
          })}
        </div>
        {groupedRegularDrops.length > 0 ? (
          <div className="grid max-h-[320px] gap-2 overflow-auto" data-testid="battle_div_monster_drops_list">
            {groupedRegularDrops.map((group) => {
              const isCollapsed = isDropSectionCollapsed(group.category);

              return (
                <div
                  className="grid gap-2 rounded-control border border-[rgba(138,116,65,0.42)] bg-black/18 p-2"
                  data-testid={`battle_div_monster_drops_category_${getTestIdSegment(group.label)}`}
                  key={group.category}
                >
                  <h3 className="text-[0.68rem] font-black uppercase tracking-wide text-text-muted">
                    <button
                      aria-expanded={!isCollapsed}
                      className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-2 text-left"
                      data-testid={`battle_heading_monster_drops_category_${getTestIdSegment(group.label)}`}
                      onClick={() => toggleDropSection(group.category)}
                      type="button"
                    >
                      <span>{group.label}</span>
                      <span aria-hidden="true">{isCollapsed ? "+" : "-"}</span>
                    </button>
                  </h3>
                  {!isCollapsed ? (
                    <div className="grid gap-2">
                      {group.drops.map((drop, index) => {
                        const item = itemsById[String(drop.item)];

                        return (
                          <div
                            className={cx(
                              "grid grid-cols-[42px_1fr] items-center gap-3 rounded-control border bg-black/24 p-2 text-sm font-bold",
                              getDropRarityBorderClass(item?.rarity)
                            )}
                            data-testid={`battle_div_monster_drop_${getTestIdSegment(group.label)}_${index}`}
                            key={`${drop.item}-${index}`}
                          >
                            <DropItemImage icon={item?.icon} isQuestDrop={false} name={item?.name} />
                            <div className="grid min-w-0 gap-0.5">
                              <strong
                                className={cx("min-w-0 truncate", getDropRarityTextClass(item?.rarity))}
                                data-testid={`battle_strong_monster_drop_name_${getTestIdSegment(group.label)}_${index}`}
                              >
                                {item?.name ?? `Item ${drop.item}`}
                              </strong>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : drops.length === 0 && questDrops.length === 0 ? (
          <MutedText data-testid="battle_p_no_monster_drops">No drops are listed for this monster.</MutedText>
        ) : null}
      </div>
    </div>
  );
}

function DropItemImage({
  icon,
  isQuestDrop,
  name
}: {
  icon: string | null | undefined;
  isQuestDrop: boolean;
  name: string | null | undefined;
}) {
  return (
    <div
      className={cx(
        "grid h-[42px] w-[42px] place-items-center rounded-[4px] border bg-black/38",
        isQuestDrop ? "border-[#f59e0b]" : "border-[rgba(226,179,63,0.34)]"
      )}
      data-testid={`battle_div_monster_drop_image_${getTestIdSegment(name ?? "unknown_item")}`}
    >
      {icon ? (
        <Image
          alt=""
          aria-hidden="true"
          className="h-9 w-9 object-contain"
          height={36}
          src={getItemIconUrl(icon)}
          unoptimized
          width={36}
        />
      ) : (
        <span className="text-xs font-black text-text-muted" aria-hidden="true">
          ?
        </span>
      )}
    </div>
  );
}

function SmallDropItemImage({
  icon,
  name
}: {
  icon: string | null | undefined;
  name: string | null | undefined;
}) {
  return (
    <span
      className="grid h-9 w-9 place-items-center"
      data-testid={`battle_span_monster_quest_drop_image_${getTestIdSegment(name ?? "unknown_item")}`}
    >
      {icon ? (
        <Image
          alt=""
          aria-hidden="true"
          className="h-8 w-8 object-contain"
          height={32}
          src={getItemIconUrl(icon)}
          unoptimized
          width={32}
        />
      ) : (
        <span className="text-xs font-black text-text-muted" aria-hidden="true">
          ?
        </span>
      )}
    </span>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="grid grid-cols-[minmax(0,1fr)_auto] gap-2"
      data-testid={`battle_div_info_row_${getTestIdSegment(label)}`}
    >
      <span className="text-text-muted" data-testid={`battle_span_info_label_${getTestIdSegment(label)}`}>
        {label}
      </span>
      <strong
        className="min-w-0 truncate text-right !text-sm"
        data-testid={`battle_strong_info_value_${getTestIdSegment(label)}`}
      >
        {value}
      </strong>
    </div>
  );
}
