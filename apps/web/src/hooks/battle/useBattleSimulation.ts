import { useEffect, useRef, type Dispatch, type SetStateAction } from "react";
import { type Character, type ItemMetadata, type MonsterFamilyVariant } from "@/lib/api";
import { getMaxCharacterResources } from "@/lib/battle/combatDisplay";
import { addDroppedItems, rollMonsterDrops, rollMonsterPenya } from "@/lib/battle/loot";
import { type BattleLogEntry, type BattlePageProps, type BattleState } from "@/lib/battle/types";
import {
  rollMonsterAutoAttack,
  rollPlayerAutoAttack,
  type AttackTiming,
  type CombatStat
} from "@/lib/combatStats";
import { applyDeathExpPenalty, applyExpGain, getMonsterExpReward } from "@/lib/characterProgression";

const maxBattleLogEntries = 50;
const passiveHpRegenIntervalMs = 5000;
const passiveHpRegenRate = 0.05;

type UseBattleSimulationOptions = {
  activeEquipmentSet: number;
  battleState: BattleState;
  canResolveCombat: boolean;
  character: Character;
  characterAttackTiming: AttackTiming;
  characterFp: number;
  characterHp: number;
  characterMp: number;
  combatStats: CombatStat[];
  currentCharacterFp: number;
  currentCharacterHp: number;
  currentCharacterMp: number;
  isCombatInProgress: boolean;
  isPauseAfterCurrentMonster: boolean;
  itemsById: Record<string, ItemMetadata>;
  monsterHp: number | null;
  onBattleStateChange: BattlePageProps["onBattleStateChange"];
  onCharacterResourcesChange: BattlePageProps["onCharacterResourcesChange"];
  onUpdateCharacterProgression: BattlePageProps["onUpdateCharacterProgression"];
  pushBattleLogEntry: (
    currentLog: BattleLogEntry[],
    message: string,
    tone: BattleLogEntry["tone"]
  ) => BattleLogEntry[];
  selectedVariant: MonsterFamilyVariant | null;
  setBattleState: Dispatch<SetStateAction<BattleState>>;
  setIsCombatInProgress: Dispatch<SetStateAction<boolean>>;
  setIsPauseAfterCurrentMonster: Dispatch<SetStateAction<boolean>>;
};

export function useBattleSimulation({
  activeEquipmentSet,
  battleState,
  canResolveCombat,
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
  onUpdateCharacterProgression,
  pushBattleLogEntry,
  selectedVariant,
  setBattleState,
  setIsCombatInProgress,
  setIsPauseAfterCurrentMonster
}: UseBattleSimulationOptions) {
  const handledMonsterDefeatCountRef = useRef(0);
  const handledPlayerDefeatCountRef = useRef(0);
  const pendingLevelUpRestoreLevelRef = useRef<number | null>(null);

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
}
