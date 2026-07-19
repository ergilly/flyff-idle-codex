"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CharacterCombatPanel } from "@/components/organisms/battle/CharacterCombatPanel";
import { DeathOverlay } from "@/components/organisms/battle/DeathOverlay";
import { MonsterPanel } from "@/components/organisms/battle/MonsterPanel";
import { useActionSlots } from "@/hooks/battle/useActionSlots";
import { useBattleLoot } from "@/hooks/battle/useBattleLoot";
import { useBattleSimulation } from "@/hooks/battle/useBattleSimulation";
import { useRecoveryItems } from "@/hooks/battle/useRecoveryItems";
import { type CharacterEquipmentSlot } from "@/lib/api";
import {
  getAutoAttackDamage,
  getAutoAttackTiming,
  getCombatStats,
  getEffectiveHitRate,
  type CombatStat
} from "@/lib/combatStats";
import { getUnlockedSkills } from "@/lib/skillTrees";
import { getVariantPower, withEffectiveHitRate } from "@/lib/battle/combatDisplay";
import { clampResourceValue, getRecoveryInventoryItems } from "@/lib/battle/recovery";
import { getRespawnDestination, getRespawnHp } from "@/lib/battle/respawn";
import { canPerformAutoAttack, isBowEquipped } from "@/lib/battle/bowAmmo";
import { applyDeathExpPenalty } from "@/lib/characterProgression";
import {
  type BattleLogEntry,
  type BattlePageProps,
  type BattleState,
  type CharacterPanelTab
} from "@/lib/battle/types";

const maxBattleLogEntries = 50;

export function BattlePage({
  character,
  initialBattleState,
  initialCharacterResources,
  itemsById,
  onBattleStateChange,
  onClearMonsterTarget,
  onCharacterResourcesChange,
  onConsumeInventoryItem,
  onConsumeEquippedArrow,
  onEquipConsumableItem,
  onLootInventoryItems,
  onRespawnAtTown,
  onUpdateCharacterProgression,
  selectedMonsterFamily,
  skillTabs
}: BattlePageProps) {
  const unlockedSkills = useMemo(() => getUnlockedSkills(skillTabs), [skillTabs]);
  const usableSkills = unlockedSkills.filter((skill) => (character.skillLevels[skill.id] ?? 0) > 0);
  const listedSkills = usableSkills.length > 0 ? usableSkills : unlockedSkills.slice(0, 8);
  const {
    actionSlots,
    addSkillToFirstAvailableSlot,
    insertSkillAtActionSlot,
    moveActionSlot,
    removeActionSlot,
    selectedActionSlotIndex,
    setSelectedActionSlotIndex
  } = useActionSlots();
  const [activeCharacterTab, setActiveCharacterTab] = useState<CharacterPanelTab>("equipment");
  const [activeEquipmentSet, setActiveEquipmentSet] = useState(0);
  const [selectedEquipmentSlot, setSelectedEquipmentSlot] = useState<CharacterEquipmentSlot | null>(null);
  const [isCombatInProgress, setIsCombatInProgress] = useState(false);
  const [isPauseAfterCurrentMonster, setIsPauseAfterCurrentMonster] = useState(false);
  const [isRespawning, setIsRespawning] = useState(false);
  const [respawnError, setRespawnError] = useState("");
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
  const canPlayerAutoAttack = canPerformAutoAttack(character, itemsById, activeEquipmentSet);
  const missingBowAmmo = isBowEquipped(character, itemsById, activeEquipmentSet) && !canPlayerAutoAttack;
  const canResolveCombat =
    isCombatInProgress &&
    selectedVariant !== null &&
    battleState.outcome === "fighting" &&
    currentMonsterHp !== null &&
    currentMonsterHp > 0 &&
    currentCharacterHp > 0;
  const canResolvePlayerAttack = canResolveCombat && canPlayerAutoAttack;

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

  const {
    handleDeleteDroppedItems,
    handleLootDroppedItems,
    handleLootSelectedDroppedItem,
    isLootPending,
    selectedDroppedItemId,
    setSelectedDroppedItemId
  } = useBattleLoot({
    droppedItems: battleState.droppedItems,
    itemsById,
    onLootInventoryItems,
    pushBattleLogEntry,
    setBattleState
  });
  const { consumableCooldownRemainingByResource, handleUseRecoveryItem } = useRecoveryItems({
    characterMaxFp: characterFp,
    characterMaxHp: characterHp,
    characterMaxMp: characterMp,
    currentCharacterFp,
    currentCharacterHp,
    currentCharacterMp,
    onConsumeInventoryItem,
    pushBattleLogEntry,
    setBattleState
  });

  useEffect(() => {
    setSelectedEquipmentSlot(null);
  }, [activeEquipmentSet]);

  useEffect(() => {
    setIsCombatInProgress(false);
    setIsPauseAfterCurrentMonster(false);
  }, [selectedMonsterFamily]);

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

  useBattleSimulation({
    activeEquipmentSet,
    battleState,
    canResolveCombat,
    canResolvePlayerAttack,
    character,
    characterAttackTiming,
    characterFp,
    characterHp,
    characterMp,
    combatStats,
    currentCharacterFp,
    currentCharacterHp,
    currentCharacterMp,
    isCombatInProgress,
    isPauseAfterCurrentMonster,
    itemsById,
    monsterHp,
    onBattleStateChange,
    onCharacterResourcesChange,
    onConsumeEquippedArrow,
    onUpdateCharacterProgression,
    pushBattleLogEntry,
    selectedVariant,
    setBattleState,
    setIsCombatInProgress,
    setIsPauseAfterCurrentMonster
  });

  function handleRunAway() {
    setIsCombatInProgress(false);
    setIsPauseAfterCurrentMonster(false);
    onClearMonsterTarget?.();
  }

  function handleStartCombat() {
    if (!canPlayerAutoAttack) {
      return;
    }

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

  function handlePauseCombat() {
    setIsPauseAfterCurrentMonster(true);
    setBattleState((current) => ({
      ...current,
      log: pushBattleLogEntry(current.log, "Combat will pause after this monster is defeated.", "muted")
    }));
  }

  function handleClearBattleLog() {
    setBattleState((current) => ({
      ...current,
      log: []
    }));
  }

  async function handleRespawnAtTown() {
    const destination = selectedMonsterFamily
      ? getRespawnDestination(selectedMonsterFamily.location.region)
      : null;

    if (!destination) {
      setRespawnError("Unable to determine the nearest respawn town.");
      return;
    }

    setIsRespawning(true);
    setRespawnError("");
    const nextProgression = applyDeathExpPenalty(character);

    try {
      await onUpdateCharacterProgression?.({
        exp: nextProgression.exp,
        level: nextProgression.level
      });
      const respawnHp = getRespawnHp(characterHp);
      const restoredResources = { fp: characterFp, hp: respawnHp, mp: characterMp };
      onCharacterResourcesChange?.(restoredResources);
      setBattleState((current) => ({
        ...current,
        characterFp,
        characterHp: respawnHp,
        characterMp,
        log:
          nextProgression.expLoss > 0
            ? pushBattleLogEntry(
                current.log,
                `${character.name} loses ${nextProgression.expLoss.toLocaleString()} EXP.`,
                "danger"
              )
            : current.log,
        outcome: "fighting"
      }));
      onClearMonsterTarget?.();
      onRespawnAtTown?.(destination);
    } catch {
      setRespawnError("Unable to apply the death penalty. Please try again.");
      setIsRespawning(false);
    }
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
        isCombatInProgress={canResolvePlayerAttack}
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
        combatUnavailableReason={
          missingBowAmmo ? "Equip arrows in the Ammo slot to attack with a bow." : null
        }
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
      {battleState.outcome === "playerDefeated" ? (
        <DeathOverlay
          error={respawnError}
          isRespawning={isRespawning}
          onRespawn={() => void handleRespawnAtTown()}
          townName={
            (selectedMonsterFamily &&
              getRespawnDestination(selectedMonsterFamily.location.region)?.townName) ??
            "town"
          }
        />
      ) : null}
    </section>
  );
}

function getCombatStatNumber(combatStats: CombatStat[], label: string) {
  const stat = combatStats.find((entry) => entry.label === label);
  const value = Number(stat?.value.replace(/,/g, ""));

  return Number.isFinite(value) ? value : 0;
}
