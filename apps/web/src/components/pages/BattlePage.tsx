"use client";

import Image from "next/image";
import { ChevronDown, Droplet, Flame, HeartPulse, Swords, Trash2 } from "lucide-react";
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
  type CharacterConsumableResource,
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
  getEffectiveHitRate,
  rollMonsterAutoAttack,
  rollPlayerAutoAttack,
  type AttackTiming,
  type AutoAttackDamage,
  type CombatStat
} from "@/lib/combatStats";
import { applyDeathExpPenalty, applyExpGain, getMonsterExpReward } from "@/lib/characterProgression";
import {
  getUnlockedSkills,
  type SkillCombo,
  type SkillDefinition,
  type SkillTreeTab
} from "@/lib/skillTrees";
import { getTestIdSegment } from "@/lib/testIds";

type ActionSlot = SkillDefinition | null;
type ConsumableResource = CharacterConsumableResource;
type RecoveryInventoryItem = {
  inventoryItem: Character["inventory"]["items"][number];
  item: ItemMetadata;
  recoverAmount: number | null;
};
type CharacterResourceState = {
  fp: number;
  hp: number;
  mp: number;
};
type ConsumableCooldownState = Record<ConsumableResource, number>;

type BattlePageProps = {
  character: Character;
  initialBattleState?: BattlePersistenceState;
  initialCharacterResources?: CharacterResourceState;
  itemsById: Record<string, ItemMetadata>;
  onBattleStateChange?: (state: BattlePersistenceState) => void;
  onClearMonsterTarget?: () => void;
  onCharacterResourcesChange?: (resources: CharacterResourceState) => void;
  onConsumeInventoryItem?: (resource: ConsumableResource) => Promise<void> | void;
  onEquipConsumableItem?: (resource: ConsumableResource, slotIndex: number | null) => void;
  onLootInventoryItems?: (items: Array<{ itemId: string; quantity: number }>) => Promise<void> | void;
  onUpdateCharacterProgression?: (progression: {
    exp?: number;
    level?: number;
    penya?: number;
  }) => Promise<void> | void;
  selectedMonsterFamily: MapMonsterFamily | null;
  skillTabs: SkillTreeTab[];
};

type CharacterPanelTab = "equipment" | "skills";
type BattleOutcome = "fighting" | "playerDefeated" | "monsterDefeated";
type BattleLogEntry = {
  id: number;
  message: string;
  tone: "danger" | "muted" | "success";
};
type BattleDroppedItem = {
  itemId: string;
  quantity: number;
};
type BattlePersistenceState = {
  droppedItems: BattleDroppedItem[];
  log: BattleLogEntry[];
};
type BattleState = {
  characterFp: number;
  characterHp: number;
  characterMp: number;
  droppedItems: BattleDroppedItem[];
  earnedPenya: number;
  log: BattleLogEntry[];
  monsterDefeatCount: number;
  monsterHp: number | null;
  outcome: BattleOutcome;
  playerDefeatCount: number;
};

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
const maxBattleLogEntries = 50;
const passiveHpRegenIntervalMs = 5000;
const passiveHpRegenRate = 0.05;
const recoverySlots: Array<{
  borderClassName: string;
  icon: typeof HeartPulse;
  label: string;
  resource: ConsumableResource;
}> = [
  {
    borderClassName: "border-[#ff6464]/78",
    icon: HeartPulse,
    label: "Food",
    resource: "hp"
  },
  {
    borderClassName: "border-[#5fb3ff]/78",
    icon: Droplet,
    label: "MP",
    resource: "mp"
  },
  {
    borderClassName: "border-[#64d875]/78",
    icon: Flame,
    label: "FP",
    resource: "fp"
  }
];
const emptyConsumableLoadout: NonNullable<Character["consumableLoadout"]> = {
  fp: null,
  hp: null,
  mp: null
};
const emptyConsumableCooldowns: ConsumableCooldownState = {
  fp: 0,
  hp: 0,
  mp: 0
};

function getSkillIconSrc(skill: SkillDefinition) {
  return `https://api.flyff.com/image/skill/colored/${skill.icon}`;
}

function clampResourceValue(value: number | null | undefined, max: number) {
  return Math.max(0, Math.min(value ?? max, max));
}

function isRecoveryCategory(item: ItemMetadata) {
  return (item.category ?? "").toLowerCase().startsWith("recovery");
}

function getRecoveryAbility(item: ItemMetadata, resource: ConsumableResource) {
  return item.abilities.find((ability) => ability.parameter.toLowerCase() === resource) ?? null;
}

function getConsumableCooldownMs(item: ItemMetadata) {
  return item.cooldown && item.cooldown > 0 ? item.cooldown * 1000 : 0;
}

function getRecoveryInventoryItems(
  character: Character,
  itemsById: Record<string, ItemMetadata>,
  resource: ConsumableResource
): RecoveryInventoryItem[] {
  return character.inventory.items
    .flatMap((inventoryItem) => {
      const item = itemsById[inventoryItem.itemId];

      if (!item || !isRecoveryCategory(item)) {
        return [];
      }

      const ability = getRecoveryAbility(item, resource);

      return ability ? [{ inventoryItem, item, recoverAmount: ability.add }] : [];
    })
    .sort((left, right) => {
      const recoverDifference = (right.recoverAmount ?? 0) - (left.recoverAmount ?? 0);

      return recoverDifference !== 0
        ? recoverDifference
        : left.item.name.localeCompare(right.item.name, undefined, { sensitivity: "base" });
    });
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

function getDropChancePercent(drop: { probabilityRange?: string; prob?: string }) {
  const chanceText = drop.probabilityRange ?? drop.prob ?? "";
  const chanceValues = Array.from(chanceText.matchAll(/\d+(?:\.\d+)?/g)).map((match) => Number(match[0]));

  if (chanceValues.length === 0) {
    return 0;
  }

  const chance = Math.max(...chanceValues);

  return chanceText.includes("%") || chance > 1 ? chance : chance * 100;
}

function rollMonsterDrops(
  drops: MonsterFamilyVariant["drops"] | undefined,
  random: () => number = Math.random
): BattleDroppedItem[] {
  return (drops ?? []).flatMap((drop) => {
    const chancePercent = getDropChancePercent(drop);

    if (chancePercent <= 0 || random() * 100 >= chancePercent) {
      return [];
    }

    return [{ itemId: String(drop.item), quantity: 1 }];
  });
}

function addDroppedItems(currentDrops: BattleDroppedItem[], nextDrops: BattleDroppedItem[]) {
  if (nextDrops.length === 0) {
    return currentDrops;
  }

  const dropsByItemId = new Map(currentDrops.map((drop) => [drop.itemId, { ...drop }]));

  nextDrops.forEach((drop) => {
    const existingDrop = dropsByItemId.get(drop.itemId);

    if (existingDrop) {
      existingDrop.quantity += drop.quantity;
    } else {
      dropsByItemId.set(drop.itemId, { ...drop });
    }
  });

  return Array.from(dropsByItemId.values());
}

function removeDroppedItems(currentDrops: BattleDroppedItem[], removedDrops: BattleDroppedItem[]) {
  const removedQuantityByItemId = new Map(removedDrops.map((drop) => [drop.itemId, drop.quantity]));

  return currentDrops.flatMap((drop) => {
    const removedQuantity = removedQuantityByItemId.get(drop.itemId) ?? 0;
    const nextQuantity = drop.quantity - removedQuantity;

    return nextQuantity > 0 ? [{ ...drop, quantity: nextQuantity }] : [];
  });
}

function rollMonsterPenya(monster: MonsterFamilyVariant, random: () => number = Math.random) {
  const minDropGold = Math.max(0, Math.floor(monster.minDropGold ?? 0));
  const maxDropGold = Math.max(minDropGold, Math.floor(monster.maxDropGold ?? minDropGold));

  return minDropGold + Math.floor(random() * (maxDropGold - minDropGold + 1));
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
  initialBattleState,
  initialCharacterResources,
  itemsById,
  onBattleStateChange,
  onClearMonsterTarget,
  onCharacterResourcesChange,
  onConsumeInventoryItem,
  onEquipConsumableItem,
  onLootInventoryItems,
  onUpdateCharacterProgression,
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
  const [selectedDroppedItemId, setSelectedDroppedItemId] = useState<string | null>(null);
  const [isLootPending, setIsLootPending] = useState(false);
  const [isCombatInProgress, setIsCombatInProgress] = useState(false);
  const [isPauseAfterCurrentMonster, setIsPauseAfterCurrentMonster] = useState(false);
  const [consumableCooldownReadyAt, setConsumableCooldownReadyAt] =
    useState<ConsumableCooldownState>(emptyConsumableCooldowns);
  const [cooldownNow, setCooldownNow] = useState(() => Date.now());
  const [actionSlots, setActionSlots] = useState<ActionSlot[]>(() =>
    Array.from({ length: actionSlotPositions.length }, () => null)
  );
  const selectedVariant =
    selectedMonsterFamily?.variants.find((variant) => variant.variantRank === "normal") ??
    selectedMonsterFamily?.variants[0] ??
    null;
  const combatStats = useMemo(
    () => getCombatStats(character, itemsById, activeEquipmentSet),
    [activeEquipmentSet, character, itemsById]
  );
  const displayedCombatStats = useMemo(
    () =>
      selectedVariant
        ? withEffectiveHitRate(
            combatStats,
            getEffectiveHitRate(character, itemsById, selectedVariant, activeEquipmentSet)
          )
        : combatStats,
    [activeEquipmentSet, character, combatStats, itemsById, selectedVariant]
  );
  const characterAttackTiming = useMemo(
    () => getAutoAttackTiming(character, combatStats, itemsById, activeEquipmentSet),
    [activeEquipmentSet, character, combatStats, itemsById]
  );
  const recoveryItemsByResource = useMemo(
    () => ({
      fp: getRecoveryInventoryItems(character, itemsById, "fp"),
      hp: getRecoveryInventoryItems(character, itemsById, "hp"),
      mp: getRecoveryInventoryItems(character, itemsById, "mp")
    }),
    [character, itemsById]
  );
  const characterHp = getCombatStatNumber(combatStats, "Max HP");
  const characterFp = getCombatStatNumber(combatStats, "Max FP");
  const characterMp = getCombatStatNumber(combatStats, "Max MP");
  const monsterHp = selectedVariant?.hp ?? null;
  const monsterAttack = selectedVariant ? getVariantPower(selectedVariant) : null;
  const autoAttackDamage = useMemo(
    () =>
      selectedVariant ? getAutoAttackDamage(character, itemsById, selectedVariant, activeEquipmentSet) : null,
    [activeEquipmentSet, character, itemsById, selectedVariant]
  );
  const monsterExperience = selectedVariant?.experience ?? null;
  const battleLogIdRef = useRef(
    initialBattleState?.log.reduce((maxId, entry) => Math.max(maxId, entry.id), 0) ?? 0
  );
  const handledMonsterDefeatCountRef = useRef(0);
  const handledPlayerDefeatCountRef = useRef(0);
  const pendingLevelUpRestoreLevelRef = useRef<number | null>(null);
  const [battleState, setBattleState] = useState<BattleState>(() => ({
    characterFp: clampResourceValue(initialCharacterResources?.fp, characterFp),
    characterHp: clampResourceValue(initialCharacterResources?.hp, characterHp),
    characterMp: clampResourceValue(initialCharacterResources?.mp, characterMp),
    droppedItems: initialBattleState?.droppedItems ?? [],
    earnedPenya: 0,
    log: initialBattleState?.log.slice(0, maxBattleLogEntries) ?? [],
    monsterDefeatCount: 0,
    monsterHp,
    outcome: "fighting",
    playerDefeatCount: 0
  }));
  const currentCharacterFp = Math.min(battleState.characterFp, characterFp);
  const currentCharacterHp = Math.min(battleState.characterHp, characterHp);
  const currentCharacterMp = Math.min(battleState.characterMp, characterMp);
  const currentMonsterHp =
    selectedVariant && battleState.monsterHp !== null
      ? Math.min(battleState.monsterHp, monsterHp ?? 0)
      : null;
  const consumableCooldownRemainingByResource: ConsumableCooldownState = {
    fp: Math.max(0, consumableCooldownReadyAt.fp - cooldownNow),
    hp: Math.max(0, consumableCooldownReadyAt.hp - cooldownNow),
    mp: Math.max(0, consumableCooldownReadyAt.mp - cooldownNow)
  };
  const canResolveCombat =
    isCombatInProgress &&
    selectedVariant !== null &&
    battleState.outcome === "fighting" &&
    currentMonsterHp !== null &&
    currentMonsterHp > 0 &&
    currentCharacterHp > 0;

  function createBattleLogEntry(message: string, tone: BattleLogEntry["tone"]): BattleLogEntry {
    battleLogIdRef.current += 1;

    return {
      id: battleLogIdRef.current,
      message,
      tone
    };
  }

  function pushBattleLogEntry(currentLog: BattleLogEntry[], message: string, tone: BattleLogEntry["tone"]) {
    return [createBattleLogEntry(message, tone), ...currentLog].slice(0, maxBattleLogEntries);
  }

  useEffect(() => {
    setSelectedEquipmentSlot(null);
  }, [activeEquipmentSet]);

  useEffect(() => {
    if (
      selectedDroppedItemId &&
      !battleState.droppedItems.some((drop) => drop.itemId === selectedDroppedItemId)
    ) {
      setSelectedDroppedItemId(null);
    }
  }, [battleState.droppedItems, selectedDroppedItemId]);

  useEffect(() => {
    setIsCombatInProgress(false);
    setIsPauseAfterCurrentMonster(false);
  }, [selectedMonsterFamily]);

  useEffect(() => {
    if (Object.values(consumableCooldownReadyAt).every((readyAt) => readyAt <= Date.now())) {
      return undefined;
    }

    const cooldownInterval = window.setInterval(() => {
      setCooldownNow(Date.now());
    }, 100);

    return () => window.clearInterval(cooldownInterval);
  }, [consumableCooldownReadyAt]);

  useEffect(() => {
    setBattleState((current) => ({
      ...current,
      characterFp: clampResourceValue(current.characterFp, characterFp),
      characterHp: clampResourceValue(current.characterHp, characterHp),
      characterMp: clampResourceValue(current.characterMp, characterMp)
    }));
  }, [activeEquipmentSet, characterFp, characterHp, characterMp]);

  useEffect(() => {
    setBattleState((current) => ({
      ...current,
      monsterHp,
      outcome: "fighting"
    }));
  }, [monsterHp, selectedVariant?.id]);

  useEffect(() => {
    if (
      pendingLevelUpRestoreLevelRef.current === null ||
      character.level < pendingLevelUpRestoreLevelRef.current
    ) {
      return;
    }

    pendingLevelUpRestoreLevelRef.current = null;
    setBattleState((current) => ({
      ...current,
      characterFp,
      characterHp,
      characterMp
    }));
  }, [character.level, characterFp, characterHp, characterMp]);

  useEffect(() => {
    onCharacterResourcesChange?.({
      fp: currentCharacterFp,
      hp: currentCharacterHp,
      mp: currentCharacterMp
    });
  }, [currentCharacterFp, currentCharacterHp, currentCharacterMp, onCharacterResourcesChange]);

  useEffect(() => {
    onBattleStateChange?.({
      droppedItems: battleState.droppedItems,
      log: battleState.log.slice(0, maxBattleLogEntries)
    });
  }, [battleState.droppedItems, battleState.log, onBattleStateChange]);

  useEffect(() => {
    setBattleState((current) => ({
      ...current,
      earnedPenya: 0
    }));
  }, [character.penya]);

  useEffect(() => {
    if (isCombatInProgress || characterHp <= 0) {
      return undefined;
    }

    const regenAmount = Math.max(1, Math.floor(characterHp * passiveHpRegenRate));
    const passiveRegenInterval = window.setInterval(() => {
      setBattleState((current) => {
        if (current.characterHp >= characterHp) {
          return current;
        }

        return {
          ...current,
          characterHp: Math.min(characterHp, current.characterHp + regenAmount)
        };
      });
    }, passiveHpRegenIntervalMs);

    return () => window.clearInterval(passiveRegenInterval);
  }, [characterHp, isCombatInProgress]);

  useEffect(() => {
    if (!canResolveCombat || !selectedVariant) {
      return undefined;
    }

    const intervalMs = Math.max(100, characterAttackTiming.secondsPerAttack * 1000);
    const playerAttackInterval = window.setInterval(() => {
      setBattleState((current) => {
        if (current.outcome !== "fighting" || current.monsterHp === null || current.monsterHp <= 0) {
          return current;
        }

        const attack = rollPlayerAutoAttack(character, itemsById, selectedVariant, activeEquipmentSet);
        const nextMonsterHp = Math.max(0, current.monsterHp - attack.damage);
        const attackMessage = attack.isHit
          ? `${character.name} ${attack.isCritical ? "critically hits" : "hits"} ${selectedVariant.name} for ${attack.damage}.`
          : `${character.name} misses ${selectedVariant.name}.`;
        let nextLog = pushBattleLogEntry(
          current.log,
          attackMessage,
          attack.isHit ? (attack.isCritical ? "success" : "muted") : "danger"
        );

        if (nextMonsterHp <= 0) {
          nextLog = pushBattleLogEntry(nextLog, `${selectedVariant.name} is defeated.`, "success");
        }

        return {
          ...current,
          log: nextLog,
          monsterDefeatCount:
            nextMonsterHp <= 0 ? current.monsterDefeatCount + 1 : current.monsterDefeatCount,
          monsterHp: nextMonsterHp,
          outcome: nextMonsterHp <= 0 ? "monsterDefeated" : "fighting"
        };
      });
    }, intervalMs);

    return () => window.clearInterval(playerAttackInterval);
  }, [
    activeEquipmentSet,
    canResolveCombat,
    character,
    characterAttackTiming.secondsPerAttack,
    itemsById,
    selectedVariant
  ]);

  useEffect(() => {
    if (!canResolveCombat || !selectedVariant) {
      return undefined;
    }

    const monsterAttackInterval = window.setInterval(() => {
      setBattleState((current) => {
        if (current.outcome !== "fighting" || current.characterHp <= 0) {
          return current;
        }

        const attack = rollMonsterAutoAttack(
          selectedVariant,
          character,
          combatStats,
          Math.random,
          itemsById,
          activeEquipmentSet
        );
        const nextCharacterHp = Math.max(0, current.characterHp - attack.damage);
        const attackMessage = attack.isHit
          ? `${selectedVariant.name} ${attack.isCritical ? "critically hits" : "hits"} ${character.name} for ${attack.damage}.`
          : `${selectedVariant.name} misses ${character.name}.`;
        let nextLog = pushBattleLogEntry(current.log, attackMessage, attack.isHit ? "danger" : "muted");

        if (nextCharacterHp <= 0) {
          nextLog = pushBattleLogEntry(nextLog, `${character.name} is defeated.`, "danger");
        }

        return {
          ...current,
          characterHp: nextCharacterHp,
          log: nextLog,
          outcome: nextCharacterHp <= 0 ? "playerDefeated" : "fighting",
          playerDefeatCount: nextCharacterHp <= 0 ? current.playerDefeatCount + 1 : current.playerDefeatCount
        };
      });
    }, 2400);

    return () => window.clearInterval(monsterAttackInterval);
  }, [activeEquipmentSet, canResolveCombat, character, combatStats, itemsById, selectedVariant]);

  useEffect(() => {
    if (battleState.outcome === "playerDefeated") {
      setIsCombatInProgress(false);
      setIsPauseAfterCurrentMonster(false);
    }
  }, [battleState.outcome]);

  useEffect(() => {
    if (
      battleState.monsterDefeatCount === 0 ||
      battleState.monsterDefeatCount === handledMonsterDefeatCountRef.current ||
      !selectedVariant
    ) {
      return;
    }

    handledMonsterDefeatCountRef.current = battleState.monsterDefeatCount;
    const penyaDrop = rollMonsterPenya(selectedVariant);
    const droppedItems = rollMonsterDrops(selectedVariant.drops);
    const nextPenya = character.penya + battleState.earnedPenya + penyaDrop;

    setBattleState((current) => {
      const nextDroppedItems = addDroppedItems(current.droppedItems, droppedItems);
      const dropMessage =
        droppedItems.length > 0
          ? `${selectedVariant.name} dropped ${droppedItems
              .map((drop) => itemsById[drop.itemId]?.name ?? `Item ${drop.itemId}`)
              .join(", ")}.`
          : `${selectedVariant.name} dropped no items.`;

      return {
        ...current,
        droppedItems: nextDroppedItems,
        earnedPenya: current.earnedPenya + penyaDrop,
        log: pushBattleLogEntry(
          pushBattleLogEntry(
            current.log,
            `${character.name} gains ${penyaDrop.toLocaleString()} Penya.`,
            "success"
          ),
          dropMessage,
          droppedItems.length > 0 ? "success" : "muted"
        )
      };
    });

    const expGain = getMonsterExpReward(character, selectedVariant);

    if (expGain <= 0) {
      setBattleState((current) => ({
        ...current,
        log: pushBattleLogEntry(current.log, `${character.name} gains no EXP.`, "muted")
      }));
      void Promise.resolve(onUpdateCharacterProgression?.({ penya: nextPenya })).catch(() => {
        setBattleState((current) => ({
          ...current,
          log: pushBattleLogEntry(current.log, "Unable to save Penya gain.", "danger")
        }));
      });
      return;
    }

    const nextProgression = applyExpGain(character, expGain);
    const didLevelUp = nextProgression.level > character.level;
    const levelUpResources = didLevelUp
      ? getMaxCharacterResources(
          { ...character, level: nextProgression.level },
          itemsById,
          activeEquipmentSet
        )
      : null;

    if (didLevelUp) {
      pendingLevelUpRestoreLevelRef.current = nextProgression.level;
    }

    setBattleState((current) => ({
      ...current,
      ...(levelUpResources
        ? {
            characterFp: levelUpResources.fp,
            characterHp: levelUpResources.hp,
            characterMp: levelUpResources.mp
          }
        : null),
      log: pushBattleLogEntry(
        current.log,
        didLevelUp
          ? `${character.name} gains ${expGain.toLocaleString()} EXP and reaches level ${nextProgression.level}.`
          : `${character.name} gains ${expGain.toLocaleString()} EXP.`,
        "success"
      )
    }));

    void Promise.resolve(onUpdateCharacterProgression?.({ ...nextProgression, penya: nextPenya })).catch(
      () => {
        setBattleState((current) => ({
          ...current,
          log: pushBattleLogEntry(current.log, "Unable to save combat rewards.", "danger")
        }));
      }
    );
  }, [
    activeEquipmentSet,
    battleState.monsterDefeatCount,
    character,
    itemsById,
    onUpdateCharacterProgression,
    selectedVariant
  ]);

  useEffect(() => {
    if (
      battleState.playerDefeatCount === 0 ||
      battleState.playerDefeatCount === handledPlayerDefeatCountRef.current
    ) {
      return;
    }

    handledPlayerDefeatCountRef.current = battleState.playerDefeatCount;
    const nextProgression = applyDeathExpPenalty(character);

    if (nextProgression.expLoss > 0) {
      setBattleState((current) => ({
        ...current,
        log: pushBattleLogEntry(
          current.log,
          `${character.name} loses ${nextProgression.expLoss.toLocaleString()} EXP.`,
          "danger"
        )
      }));
    }

    void Promise.resolve(
      onUpdateCharacterProgression?.({
        exp: nextProgression.exp,
        level: nextProgression.level
      })
    ).catch(() => {
      setBattleState((current) => ({
        ...current,
        log: pushBattleLogEntry(current.log, "Unable to save EXP penalty.", "danger")
      }));
    });
  }, [battleState.playerDefeatCount, character, onUpdateCharacterProgression]);

  useEffect(() => {
    if (!isCombatInProgress || battleState.outcome !== "monsterDefeated" || !selectedVariant) {
      return undefined;
    }

    const respawnTimeout = window.setTimeout(() => {
      setBattleState((current) => ({
        ...current,
        log: pushBattleLogEntry(
          current.log,
          isPauseAfterCurrentMonster
            ? `${selectedVariant.name} spawned. Combat paused.`
            : `${selectedVariant.name} spawned.`,
          "muted"
        ),
        monsterHp,
        outcome: "fighting"
      }));

      if (isPauseAfterCurrentMonster) {
        setIsCombatInProgress(false);
        setIsPauseAfterCurrentMonster(false);
      }
    }, 2000);

    return () => window.clearTimeout(respawnTimeout);
  }, [battleState.outcome, isCombatInProgress, isPauseAfterCurrentMonster, monsterHp, selectedVariant]);

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
    setIsPauseAfterCurrentMonster(false);
    onClearMonsterTarget?.();
  }

  function handleStartCombat() {
    setIsPauseAfterCurrentMonster(false);
    setBattleState((current) => ({
      characterFp: clampResourceValue(current.characterFp, characterFp),
      characterHp: clampResourceValue(current.characterHp, characterHp),
      characterMp: clampResourceValue(current.characterMp, characterMp),
      droppedItems: current.droppedItems,
      earnedPenya: current.earnedPenya,
      log: selectedVariant
        ? pushBattleLogEntry(current.log, `Combat started with ${selectedVariant.name}.`, "muted")
        : current.log,
      monsterDefeatCount: current.monsterDefeatCount,
      monsterHp,
      outcome: "fighting",
      playerDefeatCount: current.playerDefeatCount
    }));
    setIsCombatInProgress(true);
  }

  async function handleUseRecoveryItem(
    resource: ConsumableResource,
    recoveryItem: RecoveryInventoryItem | null
  ) {
    if (!recoveryItem || !recoveryItem.recoverAmount || recoveryItem.recoverAmount <= 0) {
      return;
    }

    const now = Date.now();
    const cooldownRemainingMs = consumableCooldownReadyAt[resource] - now;

    if (cooldownRemainingMs > 0) {
      return;
    }

    const resourceKeyByResource = {
      fp: "characterFp",
      hp: "characterHp",
      mp: "characterMp"
    } as const;
    const resourceMaxByResource = {
      fp: characterFp,
      hp: characterHp,
      mp: characterMp
    };
    const resourceCurrentByResource = {
      fp: currentCharacterFp,
      hp: currentCharacterHp,
      mp: currentCharacterMp
    };
    const resourceLabel = resource.toUpperCase();
    const currentValue = Math.min(resourceCurrentByResource[resource], resourceMaxByResource[resource]);
    const nextValue = Math.min(resourceMaxByResource[resource], currentValue + recoveryItem.recoverAmount);
    const recoveredAmount = nextValue - currentValue;

    if (recoveredAmount > 0) {
      await Promise.resolve(onConsumeInventoryItem?.(resource));
      const cooldownMs = getConsumableCooldownMs(recoveryItem.item);

      if (cooldownMs > 0) {
        setCooldownNow(now);
        setConsumableCooldownReadyAt((current) => ({
          ...current,
          [resource]: now + cooldownMs
        }));
      }
    }

    setBattleState((current) => {
      const resourceKey = resourceKeyByResource[resource];

      return {
        ...current,
        [resourceKey]: nextValue,
        log: pushBattleLogEntry(
          current.log,
          recoveredAmount > 0
            ? `${recoveryItem.item.name} restores ${recoveredAmount.toLocaleString()} ${resourceLabel}.`
            : `${resourceLabel} is already full.`,
          recoveredAmount > 0 ? "success" : "muted"
        )
      };
    });
  }

  function handlePauseCombat() {
    setIsPauseAfterCurrentMonster(true);
    setBattleState((current) => ({
      ...current,
      log: pushBattleLogEntry(current.log, "Combat will pause after this monster is defeated.", "muted")
    }));
  }

  async function handleLootDroppedItems(dropsToLoot: BattleDroppedItem[]) {
    if (dropsToLoot.length === 0 || isLootPending) {
      return;
    }

    if (!onLootInventoryItems) {
      setBattleState((current) => ({
        ...current,
        log: pushBattleLogEntry(current.log, "Unable to loot items.", "danger")
      }));
      return;
    }

    setIsLootPending(true);

    try {
      await Promise.resolve(onLootInventoryItems(dropsToLoot));
      setBattleState((current) => ({
        ...current,
        droppedItems: removeDroppedItems(current.droppedItems, dropsToLoot),
        log: pushBattleLogEntry(
          current.log,
          `Looted ${dropsToLoot
            .map(
              (drop) =>
                `${drop.quantity.toLocaleString()}x ${itemsById[drop.itemId]?.name ?? `Item ${drop.itemId}`}`
            )
            .join(", ")}.`,
          "success"
        )
      }));
      setSelectedDroppedItemId(null);
    } catch (lootError) {
      setBattleState((current) => ({
        ...current,
        log: pushBattleLogEntry(
          current.log,
          lootError instanceof Error ? lootError.message : "Unable to loot items.",
          "danger"
        )
      }));
    } finally {
      setIsLootPending(false);
    }
  }

  function handleLootSelectedDroppedItem() {
    const selectedDrop = battleState.droppedItems.find((drop) => drop.itemId === selectedDroppedItemId);

    if (selectedDrop) {
      void handleLootDroppedItems([selectedDrop]);
    }
  }

  function handleDeleteDroppedItems() {
    setBattleState((current) => ({
      ...current,
      droppedItems: [],
      log:
        current.droppedItems.length > 0
          ? pushBattleLogEntry(current.log, "Deleted remaining dropped items.", "muted")
          : current.log
    }));
    setSelectedDroppedItemId(null);
  }

  function handleClearBattleLog() {
    setBattleState((current) => ({
      ...current,
      log: []
    }));
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
        characterFp={currentCharacterFp}
        characterMaxFp={characterFp}
        characterHp={currentCharacterHp}
        characterMaxHp={characterHp}
        characterMp={currentCharacterMp}
        characterMaxMp={characterMp}
        characterAttackTiming={characterAttackTiming}
        combatStats={displayedCombatStats}
        cooldownRemainingByResource={consumableCooldownRemainingByResource}
        battleLog={battleState.log}
        isCombatInProgress={canResolveCombat}
        itemsById={itemsById}
        onAddSkillToActionSlot={addSkillToFirstAvailableSlot}
        onInsertSkillAtActionSlot={insertSkillAtActionSlot}
        onMoveActionSlot={moveActionSlot}
        onRemoveActionSlot={removeActionSlot}
        onSelectActionSlot={setSelectedActionSlotIndex}
        onSelectEquipmentSlot={setSelectedEquipmentSlot}
        onSelectEquipmentSet={setActiveEquipmentSet}
        onTabChange={setActiveCharacterTab}
        onClearBattleLog={handleClearBattleLog}
        onEquipConsumableItem={onEquipConsumableItem}
        onUseRecoveryItem={handleUseRecoveryItem}
        selectedActionSlotIndex={selectedActionSlotIndex}
        selectedEquipmentSlot={selectedEquipmentSlot}
        recoveryItemsByResource={recoveryItemsByResource}
        skillTabs={skillTabs}
        skills={listedSkills}
      />

      <MonsterPanel
        itemsById={itemsById}
        autoAttackDamage={autoAttackDamage}
        battleOutcome={battleState.outcome}
        droppedItems={battleState.droppedItems}
        isLootPending={isLootPending}
        isPauseAfterCurrentMonster={isPauseAfterCurrentMonster}
        monsterAttack={monsterAttack}
        monsterExperience={monsterExperience}
        isCombatInProgress={isCombatInProgress}
        isAttackTimelineActive={canResolveCombat}
        monsterFamily={selectedMonsterFamily}
        monsterHp={currentMonsterHp}
        monsterMaxHp={monsterHp}
        onRunAway={handleRunAway}
        onPauseCombat={handlePauseCombat}
        onStartCombat={handleStartCombat}
        onDeleteDroppedItems={handleDeleteDroppedItems}
        onLootAllDroppedItems={() => void handleLootDroppedItems(battleState.droppedItems)}
        onLootDroppedItem={(drop) => void handleLootDroppedItems([drop])}
        onLootSelectedDroppedItem={handleLootSelectedDroppedItem}
        onSelectDroppedItem={setSelectedDroppedItemId}
        selectedDroppedItemId={selectedDroppedItemId}
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
  characterMaxFp,
  characterHp,
  characterMaxHp,
  characterMp,
  characterMaxMp,
  combatStats,
  cooldownRemainingByResource,
  battleLog,
  isCombatInProgress,
  itemsById,
  onMoveActionSlot,
  onRemoveActionSlot,
  onSelectActionSlot,
  onSelectEquipmentSlot,
  onSelectEquipmentSet,
  onTabChange,
  onAddSkillToActionSlot,
  onClearBattleLog,
  onEquipConsumableItem,
  onUseRecoveryItem,
  recoveryItemsByResource,
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
  characterMaxFp: number;
  characterHp: number;
  characterMaxHp: number;
  characterMp: number;
  characterMaxMp: number;
  combatStats: CombatStat[];
  cooldownRemainingByResource: ConsumableCooldownState;
  battleLog: BattleLogEntry[];
  isCombatInProgress: boolean;
  itemsById: Record<string, ItemMetadata>;
  onAddSkillToActionSlot: (skill: SkillDefinition) => void;
  onClearBattleLog: () => void;
  onEquipConsumableItem?: (resource: ConsumableResource, slotIndex: number | null) => void;
  onInsertSkillAtActionSlot: (skill: SkillDefinition, targetSlotIndex: number) => void;
  onMoveActionSlot: (sourceSlotIndex: number, targetSlotIndex: number) => void;
  onRemoveActionSlot: (slotIndex: number) => void;
  onSelectActionSlot: (slotIndex: number) => void;
  onSelectEquipmentSlot: (slot: CharacterEquipmentSlot) => void;
  onSelectEquipmentSet: (setIndex: number) => void;
  onTabChange: (tab: CharacterPanelTab) => void;
  onUseRecoveryItem: (resource: ConsumableResource, recoveryItem: RecoveryInventoryItem | null) => void;
  recoveryItemsByResource: Record<ConsumableResource, RecoveryInventoryItem[]>;
  selectedActionSlotIndex: number;
  selectedEquipmentSlot: CharacterEquipmentSlot | null;
  skillTabs: SkillTreeTab[];
  skills: SkillDefinition[];
}) {
  return (
    <Panel
      as="section"
      className="h-full min-h-0 gap-4 [grid-template-rows:auto_minmax(0,1fr)]"
      data-testid="battle_panel_character"
    >
      <CharacterCombatHeader
        attackTiming={characterAttackTiming}
        characterFp={characterFp}
        characterMaxFp={characterMaxFp}
        characterHp={characterHp}
        characterMaxHp={characterMaxHp}
        characterMp={characterMp}
        characterMaxMp={characterMaxMp}
        isCombatInProgress={isCombatInProgress}
      />
      <div className="grid min-h-0 items-stretch gap-4 lg:grid-cols-2">
        <div
          className="grid min-h-0 min-w-0 gap-4 [grid-template-rows:auto_auto_minmax(0,1fr)]"
          data-testid="battle_div_character_control_column"
        >
          <FoodPanel
            consumableLoadout={character.consumableLoadout ?? emptyConsumableLoadout}
            cooldownRemainingByResource={cooldownRemainingByResource}
            itemsById={itemsById}
            onEquipConsumableItem={onEquipConsumableItem}
            onUseRecoveryItem={onUseRecoveryItem}
            recoveryItemsByResource={recoveryItemsByResource}
          />
          <CharacterBattleTabs activeTab={activeTab} onTabChange={onTabChange} />
          <Panel
            as="section"
            className="h-full min-h-0 content-start gap-4 overflow-y-auto [&_[data-testid='equipment_div_content']]:justify-center [&_[data-testid='equipment_div_layout']]:!max-w-[190px]"
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
        <div
          className="grid min-h-0 min-w-0 gap-4 [grid-template-rows:auto_minmax(0,1fr)]"
          data-testid="battle_div_character_stats_column"
        >
          <CharacterStatsPanel combatStats={combatStats} />
          <MonsterLootBox battleLog={battleLog} onClearBattleLog={onClearBattleLog} />
        </div>
      </div>
    </Panel>
  );
}

function CharacterCombatHeader({
  attackTiming,
  characterFp,
  characterMaxFp,
  characterHp,
  characterMaxHp,
  characterMp,
  characterMaxMp,
  isCombatInProgress
}: {
  attackTiming: AttackTiming;
  characterFp: number;
  characterMaxFp: number;
  characterHp: number;
  characterMaxHp: number;
  characterMp: number;
  characterMaxMp: number;
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
          max={characterMaxHp}
          tone="hp"
        />
        <StatusBar
          label="MP"
          testIdPrefix="battle_character_header"
          value={characterMp}
          max={characterMaxMp}
          tone="mp"
        />
        <StatusBar
          label="FP"
          testIdPrefix="battle_character_header"
          value={characterFp}
          max={characterMaxFp}
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

function FoodPanel({
  consumableLoadout,
  cooldownRemainingByResource,
  itemsById,
  onEquipConsumableItem,
  onUseRecoveryItem,
  recoveryItemsByResource
}: {
  consumableLoadout: NonNullable<Character["consumableLoadout"]>;
  cooldownRemainingByResource: ConsumableCooldownState;
  itemsById: Record<string, ItemMetadata>;
  onEquipConsumableItem?: (resource: ConsumableResource, slotIndex: number | null) => void;
  onUseRecoveryItem: (
    resource: ConsumableResource,
    recoveryItem: RecoveryInventoryItem | null
  ) => Promise<void> | void;
  recoveryItemsByResource: Record<ConsumableResource, RecoveryInventoryItem[]>;
}) {
  const [openRecoveryResource, setOpenRecoveryResource] = useState<ConsumableResource | null>(null);

  useEffect(() => {
    if (
      openRecoveryResource &&
      recoveryItemsByResource[openRecoveryResource].length === 0 &&
      !consumableLoadout[openRecoveryResource]
    ) {
      setOpenRecoveryResource(null);
    }
  }, [consumableLoadout, openRecoveryResource, recoveryItemsByResource]);

  return (
    <Panel as="section" className="min-w-0 content-start gap-3" data-testid="battle_panel_food">
      <SectionHeading eyebrow="Recovery" testId="battle_heading_food" />
      <div
        className="grid grid-cols-3 gap-2 rounded-control border border-[rgba(138,116,65,0.58)] bg-black/24 p-2"
        data-testid="battle_div_food_slots"
      >
        {recoverySlots.map((slot) => {
          const Icon = slot.icon;
          const items = recoveryItemsByResource[slot.resource];
          const selectedConsumable = consumableLoadout[slot.resource];
          const hasEquippedConsumable = Boolean(selectedConsumable);
          const selectedItem = selectedConsumable ? itemsById[selectedConsumable.itemId] : null;
          const selectedEntry =
            selectedConsumable && selectedItem
              ? {
                  inventoryItem: {
                    itemId: selectedConsumable.itemId,
                    quantity: selectedConsumable.quantity,
                    slotIndex: -1
                  },
                  item: selectedItem,
                  recoverAmount: getRecoveryAbility(selectedItem, slot.resource)?.add ?? null
                }
              : null;
          const menuLabel = `${slot.label} recovery item`;
          const isOpen = openRecoveryResource === slot.resource;
          const cooldownRemainingMs = cooldownRemainingByResource[slot.resource];
          const isCoolingDown = cooldownRemainingMs > 0;
          const cooldownRemainingSeconds = Math.ceil(cooldownRemainingMs / 1000);
          const cooldownMs = selectedEntry ? getConsumableCooldownMs(selectedEntry.item) : 0;
          const cooldownRemainingPercent =
            cooldownMs > 0 ? Math.min(100, Math.max(0, (cooldownRemainingMs / cooldownMs) * 100)) : 0;
          const cooldownElapsedPercent = 100 - cooldownRemainingPercent;
          const canOpenMenu = items.length > 0 || hasEquippedConsumable;

          return (
            <div
              className="relative grid min-w-0 gap-1"
              data-testid={`battle_div_food_slot_${slot.resource}`}
              key={slot.resource}
            >
              <div
                className={cx(
                  "grid h-[46px] w-full min-w-0 grid-cols-[minmax(0,1fr)_18px] overflow-hidden rounded-[4px] border-2 bg-black/42 text-left shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)] transition-colors hover:bg-black/30 focus:outline-none focus:ring-2 focus:ring-[#f5d451]/55 disabled:cursor-not-allowed disabled:opacity-60",
                  slot.borderClassName,
                  isOpen ? "bg-[rgba(245,212,81,0.12)]" : ""
                )}
                data-testid={`battle_div_food_control_${slot.resource}`}
              >
                <button
                  aria-label={`Use ${slot.label} recovery item`}
                  className="relative grid min-w-0 place-items-center p-1 disabled:cursor-not-allowed"
                  data-testid={`battle_button_food_${slot.resource}`}
                  disabled={!selectedEntry || isCoolingDown}
                  onClick={() => onUseRecoveryItem(slot.resource, selectedEntry ?? null)}
                  title={
                    isCoolingDown
                      ? `${selectedEntry?.item.name ?? slot.label} ready in ${cooldownRemainingSeconds}s`
                      : (selectedEntry?.item.name ?? slot.label)
                  }
                  type="button"
                >
                  <span
                    className="grid h-9 w-9 place-items-center"
                    data-testid={`battle_span_food_icon_${slot.resource}`}
                  >
                    {selectedEntry?.item.icon ? (
                      <Image
                        alt=""
                        aria-hidden="true"
                        className="h-9 w-9 object-contain"
                        height={36}
                        src={getItemIconUrl(selectedEntry.item.icon)}
                        unoptimized
                        width={36}
                      />
                    ) : (
                      <Icon aria-hidden="true" className="text-text-muted" size={20} />
                    )}
                  </span>
                  {selectedEntry ? (
                    <>
                      <span
                        className="absolute bottom-0.5 right-0.5 rounded-[3px] border border-black/60 bg-black/82 px-1 text-[0.72rem] font-black leading-4 text-foreground shadow-[0_1px_2px_rgba(0,0,0,0.45)]"
                        data-testid={`battle_span_food_quantity_${slot.resource}`}
                      >
                        x{selectedEntry.inventoryItem.quantity.toLocaleString()}
                      </span>
                      {selectedEntry.recoverAmount !== null ? (
                        <span
                          className="absolute left-0.5 top-0.5 px-1 text-[0.72rem] font-black leading-4 text-primary drop-shadow-[0_1px_1px_rgba(0,0,0,0.92)]"
                          data-testid={`battle_span_food_recovery_${slot.resource}`}
                        >
                          +{selectedEntry.recoverAmount.toLocaleString()}
                        </span>
                      ) : null}
                      {isCoolingDown ? (
                        <>
                          <span
                            aria-hidden="true"
                            className="absolute inset-0 rounded-[3px] opacity-95 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.14)]"
                            data-testid={`battle_span_food_cooldown_clock_${slot.resource}`}
                            style={{
                              background: `conic-gradient(from 0deg, rgba(6,6,6,0.2) 0% ${cooldownElapsedPercent}%, rgba(6,6,6,0.82) ${cooldownElapsedPercent}% 100%)`
                            }}
                          />
                          <span
                            className="absolute inset-0 grid place-items-center rounded-[3px] bg-black/22 text-[0.78rem] font-black text-primary drop-shadow-[0_1px_2px_rgba(0,0,0,0.95)]"
                            data-testid={`battle_span_food_cooldown_${slot.resource}`}
                          >
                            {cooldownRemainingSeconds}s
                          </span>
                        </>
                      ) : null}
                    </>
                  ) : null}
                </button>
                <button
                  aria-expanded={isOpen}
                  aria-label={menuLabel}
                  className="grid h-full place-items-center border-l border-white/10 bg-black/26 transition-colors hover:bg-[rgba(245,212,81,0.14)] disabled:cursor-not-allowed disabled:opacity-60"
                  data-testid={`battle_button_food_menu_${slot.resource}`}
                  disabled={!canOpenMenu}
                  onClick={() =>
                    setOpenRecoveryResource((current) => (current === slot.resource ? null : slot.resource))
                  }
                  type="button"
                >
                  <ChevronDown
                    aria-hidden="true"
                    className={cx("text-text-muted transition-transform", isOpen ? "rotate-180" : "")}
                    size={16}
                  />
                </button>
              </div>
              {isOpen ? (
                <div
                  aria-label={`${slot.label} recovery options`}
                  className="absolute left-0 top-[52px] z-20 grid max-h-[220px] w-[min(240px,calc(100vw-2rem))] gap-1 overflow-y-auto rounded-control border border-[rgba(226,179,63,0.58)] bg-[linear-gradient(180deg,rgba(31,29,22,0.98),rgba(5,6,5,0.98))] p-2 shadow-[0_16px_30px_rgba(0,0,0,0.46)] [scrollbar-color:rgba(245,212,81,0.55)_rgba(0,0,0,0.28)] [scrollbar-width:thin]"
                  data-testid={`battle_div_food_menu_${slot.resource}`}
                  role="menu"
                >
                  {hasEquippedConsumable ? (
                    <button
                      className="grid min-w-0 grid-cols-[34px_minmax(0,1fr)] items-center gap-2 rounded-[4px] border border-transparent bg-black/20 p-2 text-left text-xs font-bold transition-colors hover:border-primary hover:bg-[rgba(245,212,81,0.1)]"
                      data-testid={`battle_button_food_option_${slot.resource}_none`}
                      onClick={() => {
                        onEquipConsumableItem?.(slot.resource, null);
                        setOpenRecoveryResource(null);
                      }}
                      role="menuitem"
                      type="button"
                    >
                      <span className="grid h-[34px] w-[34px] place-items-center rounded-[4px] border border-[rgba(138,116,65,0.58)] bg-black/38">
                        <Icon aria-hidden="true" className="text-text-muted" size={18} />
                      </span>
                      <span className="grid min-w-0 gap-0.5">
                        <strong className="min-w-0 truncate text-foreground">None</strong>
                        <span className="text-[0.68rem] font-black uppercase tracking-wide text-text-muted">
                          Unequip
                        </span>
                      </span>
                    </button>
                  ) : null}
                  {items.map((entry) => {
                    const isSelected = entry.item.id === selectedEntry?.item.id;

                    return (
                      <button
                        className={cx(
                          "grid min-w-0 grid-cols-[34px_minmax(0,1fr)] items-center gap-2 rounded-[4px] border border-transparent bg-black/20 p-2 text-left text-xs font-bold transition-colors hover:border-primary hover:bg-[rgba(245,212,81,0.1)]",
                          isSelected ? "border-[#f5d451]/60 bg-[rgba(245,212,81,0.14)]" : ""
                        )}
                        data-testid={`battle_button_food_option_${slot.resource}_${getTestIdSegment(entry.item.name)}`}
                        key={`${slot.resource}-${entry.inventoryItem.slotIndex}`}
                        onClick={() => {
                          onEquipConsumableItem?.(slot.resource, entry.inventoryItem.slotIndex);
                          setOpenRecoveryResource(null);
                        }}
                        role="menuitem"
                        type="button"
                      >
                        <span className="grid h-[34px] w-[34px] place-items-center rounded-[4px] border border-[rgba(138,116,65,0.58)] bg-black/38">
                          {entry.item.icon ? (
                            <Image
                              alt=""
                              aria-hidden="true"
                              className="h-8 w-8 object-contain"
                              height={32}
                              src={getItemIconUrl(entry.item.icon)}
                              unoptimized
                              width={32}
                            />
                          ) : (
                            <Icon aria-hidden="true" className="text-text-muted" size={18} />
                          )}
                        </span>
                        <span className="grid min-w-0 gap-0.5">
                          <strong className="min-w-0 truncate text-foreground">{entry.item.name}</strong>
                          <span className="text-[0.68rem] font-black uppercase tracking-wide text-text-muted">
                            x{entry.inventoryItem.quantity}
                            {entry.recoverAmount !== null ? ` / +${entry.recoverAmount}` : ""}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        })}
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
      <SectionHeading eyebrow="Loadout" testId="battle_heading_character_menu" />
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
      <SectionHeading eyebrow="Character" testId="battle_heading_character_stats" />
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

function getMaxCharacterResources(
  character: Character,
  itemsById: Record<string, ItemMetadata>,
  equipmentSet: number
): CharacterResourceState {
  const combatStats = getCombatStats(character, itemsById, equipmentSet);

  return {
    fp: getCombatStatNumber(combatStats, "Max FP"),
    hp: getCombatStatNumber(combatStats, "Max HP"),
    mp: getCombatStatNumber(combatStats, "Max MP")
  };
}

function withEffectiveHitRate(combatStats: CombatStat[], effectiveHitRate: number) {
  return combatStats.map((stat) =>
    stat.label === "Hit Rate"
      ? {
          label: "Hit Rate",
          value: `${effectiveHitRate.toFixed(0)}%`
        }
      : stat
  );
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
  battleOutcome,
  droppedItems,
  isAttackTimelineActive,
  isCombatInProgress,
  isLootPending,
  isPauseAfterCurrentMonster,
  itemsById,
  monsterAttack,
  monsterExperience,
  monsterFamily,
  monsterHp,
  monsterMaxHp,
  onDeleteDroppedItems,
  onLootAllDroppedItems,
  onLootDroppedItem,
  onLootSelectedDroppedItem,
  onPauseCombat,
  onRunAway,
  onSelectDroppedItem,
  onStartCombat,
  selectedDroppedItemId,
  selectedVariant
}: {
  autoAttackDamage: AutoAttackDamage | null;
  battleOutcome: BattleOutcome;
  droppedItems: BattleDroppedItem[];
  isAttackTimelineActive: boolean;
  isCombatInProgress: boolean;
  isLootPending: boolean;
  isPauseAfterCurrentMonster: boolean;
  itemsById: Record<string, ItemMetadata>;
  monsterAttack: number | null;
  monsterExperience: number | null;
  monsterFamily: MapMonsterFamily | null;
  monsterHp: number | null;
  monsterMaxHp: number | null;
  onDeleteDroppedItems: () => void;
  onLootAllDroppedItems: () => void;
  onLootDroppedItem: (drop: BattleDroppedItem) => void;
  onLootSelectedDroppedItem: () => void;
  onPauseCombat: () => void;
  onRunAway: () => void;
  onSelectDroppedItem: (itemId: string) => void;
  onStartCombat: () => void;
  selectedDroppedItemId: string | null;
  selectedVariant: MonsterFamilyVariant | null;
}) {
  const [isDropsOverlayOpen, setIsDropsOverlayOpen] = useState(false);

  return (
    <Panel
      as="section"
      className="h-full min-h-0 gap-4 [grid-template-rows:auto_auto_auto_minmax(0,1fr)]"
      data-testid="battle_panel_monster"
    >
      <MonsterCombatHeader
        isCombatInProgress={isAttackTimelineActive}
        monsterHp={monsterHp}
        monsterMaxHp={monsterMaxHp}
      />
      <MonsterBasicPanel monsterFamily={monsterFamily} selectedVariant={selectedVariant} />
      <MonsterStatsAndOptionsPanel
        autoAttackDamage={autoAttackDamage}
        battleOutcome={battleOutcome}
        isCombatInProgress={isCombatInProgress}
        isPauseAfterCurrentMonster={isPauseAfterCurrentMonster}
        monsterAttack={monsterAttack}
        monsterExperience={monsterExperience}
        onPauseCombat={onPauseCombat}
        onRunAway={onRunAway}
        onStartCombat={onStartCombat}
        onViewDrops={() => setIsDropsOverlayOpen(true)}
        selectedVariant={selectedVariant}
      />
      <MonsterDroppedItemsSection
        droppedItems={droppedItems}
        isLootPending={isLootPending}
        itemsById={itemsById}
        onDeleteDroppedItems={onDeleteDroppedItems}
        onLootAllDroppedItems={onLootAllDroppedItems}
        onLootDroppedItem={onLootDroppedItem}
        onLootSelectedDroppedItem={onLootSelectedDroppedItem}
        onSelectDroppedItem={onSelectDroppedItem}
        selectedDroppedItemId={selectedDroppedItemId}
      />
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
  monsterHp,
  monsterMaxHp
}: {
  isCombatInProgress: boolean;
  monsterHp: number | null;
  monsterMaxHp: number | null;
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
          value={monsterHp}
          max={monsterMaxHp ?? monsterHp}
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
  selectedVariant
}: {
  monsterFamily: MapMonsterFamily | null;
  selectedVariant: MonsterFamilyVariant | null;
}) {
  return (
    <Panel as="section" className="content-start gap-4" data-testid="battle_panel_monster_basic">
      <SectionHeading eyebrow="Target" testId="battle_heading_monster_basic" />
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
            <InfoRow label="Monster" value={selectedVariant.name} />
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
  battleOutcome,
  isCombatInProgress,
  isPauseAfterCurrentMonster,
  monsterAttack,
  monsterExperience,
  onPauseCombat,
  onRunAway,
  onStartCombat,
  onViewDrops,
  selectedVariant
}: {
  autoAttackDamage: AutoAttackDamage | null;
  battleOutcome: BattleOutcome;
  isCombatInProgress: boolean;
  isPauseAfterCurrentMonster: boolean;
  monsterAttack: number | null;
  monsterExperience: number | null;
  onPauseCombat: () => void;
  onRunAway: () => void;
  onStartCombat: () => void;
  onViewDrops: () => void;
  selectedVariant: MonsterFamilyVariant | null;
}) {
  return (
    <Panel as="section" className="content-start gap-4" data-testid="battle_panel_monster_stats">
      <SectionHeading eyebrow="Monster" testId="battle_heading_monster_stats" />
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
              label="EXP"
              value={monsterExperience === null ? "Unknown" : Math.floor(monsterExperience).toLocaleString()}
            />
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
                <InfoRow label="Hit Chance" value={`${autoAttackDamage.effectiveHitRate.toFixed(0)}%`} />
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
            battleOutcome={battleOutcome}
            isCombatInProgress={isCombatInProgress}
            isPauseAfterCurrentMonster={isPauseAfterCurrentMonster}
            onPauseCombat={onPauseCombat}
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
  battleOutcome,
  isCombatInProgress,
  isPauseAfterCurrentMonster,
  onPauseCombat,
  onRunAway,
  onStartCombat,
  onViewDrops,
  selectedVariant
}: {
  battleOutcome: BattleOutcome;
  isCombatInProgress: boolean;
  isPauseAfterCurrentMonster: boolean;
  onPauseCombat: () => void;
  onRunAway: () => void;
  onStartCombat: () => void;
  onViewDrops: () => void;
  selectedVariant: MonsterFamilyVariant | null;
}) {
  const startLabel =
    battleOutcome === "monsterDefeated" || battleOutcome === "playerDefeated"
      ? "Restart combat"
      : "Start combat";

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
          <Button
            data-testid="battle_button_pause_combat"
            disabled={isPauseAfterCurrentMonster}
            onClick={onPauseCombat}
            type="button"
          >
            {isPauseAfterCurrentMonster ? "Pausing..." : "Pause combat"}
          </Button>
        ) : (
          <Button
            data-testid="battle_button_start_combat"
            disabled={!selectedVariant}
            onClick={onStartCombat}
            type="button"
          >
            {startLabel}
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
        {isCombatInProgress ? (
          <Button data-testid="battle_button_run_away" onClick={onRunAway} type="button" variant="secondary">
            Run away
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function MonsterLootBox({
  battleLog,
  onClearBattleLog
}: {
  battleLog: BattleLogEntry[];
  onClearBattleLog: () => void;
}) {
  return (
    <Panel
      as="section"
      className="h-full min-h-0 gap-3 [grid-template-rows:auto_minmax(0,1fr)]"
      data-testid="battle_panel_monster_loot_box"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <SectionHeading eyebrow="Combat Log" testId="battle_heading_monster_loot_box" />
        <Button
          className="min-h-9 px-3 text-sm"
          data-testid="battle_button_clear_combat_log"
          disabled={battleLog.length === 0}
          onClick={onClearBattleLog}
          type="button"
          variant="secondary"
        >
          Clear
        </Button>
      </div>
      <div
        className="grid min-h-0 overflow-y-auto rounded-control border border-dashed border-[rgba(138,116,65,0.62)] bg-black/24 p-3 pr-2 [scrollbar-color:rgba(245,212,81,0.55)_rgba(0,0,0,0.28)] [scrollbar-width:thin]"
        data-testid="battle_div_monster_loot_box_inventory"
      >
        {battleLog.length > 0 ? (
          <ol className="grid content-start gap-1.5 text-sm font-bold" data-testid="battle_list_combat_log">
            {battleLog.map((entry) => (
              <li
                className={cx(
                  "rounded-[4px] border border-transparent bg-black/18 px-2 py-1",
                  entry.tone === "danger"
                    ? "text-[#ff9b86]"
                    : entry.tone === "success"
                      ? "text-[#94e6a7]"
                      : "text-text-muted"
                )}
                data-testid={`battle_li_combat_log_${entry.id}`}
                key={entry.id}
              >
                {entry.message}
              </li>
            ))}
          </ol>
        ) : (
          <div className="grid place-items-center">
            <MutedText data-testid="battle_p_monster_loot_box_empty">No combat actions yet.</MutedText>
          </div>
        )}
      </div>
    </Panel>
  );
}

function MonsterDroppedItemsSection({
  droppedItems,
  isLootPending,
  itemsById,
  onDeleteDroppedItems,
  onLootAllDroppedItems,
  onLootDroppedItem,
  onLootSelectedDroppedItem,
  onSelectDroppedItem,
  selectedDroppedItemId
}: {
  droppedItems: BattleDroppedItem[];
  isLootPending: boolean;
  itemsById: Record<string, ItemMetadata>;
  onDeleteDroppedItems: () => void;
  onLootAllDroppedItems: () => void;
  onLootDroppedItem: (drop: BattleDroppedItem) => void;
  onLootSelectedDroppedItem: () => void;
  onSelectDroppedItem: (itemId: string) => void;
  selectedDroppedItemId: string | null;
}) {
  const hasDroppedItems = droppedItems.length > 0;

  return (
    <Panel
      as="section"
      className="h-full min-h-0 gap-3 [grid-template-rows:auto_minmax(0,1fr)]"
      data-testid="battle_panel_monster_dropped_items"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <SectionHeading eyebrow="Drops" testId="battle_heading_monster_dropped_items" />
        <div className="flex flex-wrap gap-2" data-testid="battle_div_monster_dropped_item_actions">
          <Button
            className="min-h-9 px-3 text-sm"
            data-testid="battle_button_loot_selected_drop"
            disabled={!hasDroppedItems || !selectedDroppedItemId || isLootPending}
            onClick={onLootSelectedDroppedItem}
            type="button"
          >
            Loot
          </Button>
          <Button
            className="min-h-9 px-3 text-sm"
            data-testid="battle_button_loot_all_drops"
            disabled={!hasDroppedItems || isLootPending}
            onClick={onLootAllDroppedItems}
            type="button"
            variant="secondary"
          >
            Loot all
          </Button>
          <Button
            aria-label="Delete remaining dropped items"
            className="min-h-9 px-3 text-sm"
            data-testid="battle_button_delete_drops"
            disabled={!hasDroppedItems || isLootPending}
            onClick={onDeleteDroppedItems}
            title="Delete remaining dropped items"
            type="button"
            variant="secondary"
          >
            <Trash2 aria-hidden="true" size={16} />
          </Button>
        </div>
      </div>
      <div
        className="grid min-h-0 overflow-y-auto rounded-control border border-dashed border-[rgba(138,116,65,0.62)] bg-black/24 p-3 pr-2 [scrollbar-color:rgba(245,212,81,0.55)_rgba(0,0,0,0.28)] [scrollbar-width:thin]"
        data-testid="battle_div_monster_dropped_items_inventory"
      >
        {hasDroppedItems ? (
          <ol
            className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] content-start gap-2"
            data-testid="battle_list_monster_dropped_items"
          >
            {droppedItems.map((drop) => {
              const item = itemsById[drop.itemId];
              const itemName = item?.name ?? `Item ${drop.itemId}`;
              const isSelected = selectedDroppedItemId === drop.itemId;

              return (
                <li
                  data-testid={`battle_li_monster_dropped_item_${getTestIdSegment(itemName)}`}
                  key={drop.itemId}
                >
                  <button
                    aria-label={`Select dropped item ${itemName}`}
                    aria-pressed={isSelected}
                    className={cx(
                      "grid w-full min-w-0 grid-cols-[42px_1fr] items-center gap-3 rounded-control border bg-black/24 p-2 text-left text-sm font-bold transition-colors hover:border-primary disabled:cursor-wait disabled:opacity-70",
                      getDropRarityBorderClass(item?.rarity),
                      isSelected ? "bg-[rgba(245,212,81,0.14)] ring-2 ring-[#f5d451]/55" : ""
                    )}
                    data-testid={`battle_button_monster_dropped_item_${getTestIdSegment(itemName)}`}
                    disabled={isLootPending}
                    onClick={() => onSelectDroppedItem(drop.itemId)}
                    onDoubleClick={() => onLootDroppedItem(drop)}
                    type="button"
                  >
                    <DropItemImage icon={item?.icon} isQuestDrop={isQuestDropItem(item)} name={itemName} />
                    <span className="grid min-w-0 gap-0.5">
                      <strong
                        className={cx("min-w-0 truncate", getDropRarityTextClass(item?.rarity))}
                        data-testid={`battle_strong_monster_dropped_item_name_${getTestIdSegment(itemName)}`}
                      >
                        {itemName}
                      </strong>
                      <span
                        className="text-xs font-black uppercase tracking-wide text-text-muted"
                        data-testid={`battle_span_monster_dropped_item_quantity_${getTestIdSegment(itemName)}`}
                      >
                        x{drop.quantity.toLocaleString()}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        ) : (
          <div className="grid place-items-center">
            <MutedText data-testid="battle_p_monster_dropped_items_empty">
              No items have dropped yet.
            </MutedText>
          </div>
        )}
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
