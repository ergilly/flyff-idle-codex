import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { emptyConsumableCooldowns, getConsumableCooldownMs } from "@/lib/battle/recovery";
import {
  type BattleLogEntry,
  type BattlePageProps,
  type BattleState,
  type ConsumableCooldownState,
  type ConsumableResource,
  type RecoveryInventoryItem
} from "@/lib/battle/types";

type UseRecoveryItemsOptions = {
  characterMaxFp: number;
  characterMaxHp: number;
  characterMaxMp: number;
  currentCharacterFp: number;
  currentCharacterHp: number;
  currentCharacterMp: number;
  onConsumeInventoryItem: BattlePageProps["onConsumeInventoryItem"];
  pushBattleLogEntry: (
    currentLog: BattleLogEntry[],
    message: string,
    tone: BattleLogEntry["tone"]
  ) => BattleLogEntry[];
  setBattleState: Dispatch<SetStateAction<BattleState>>;
};

export function useRecoveryItems({
  characterMaxFp: characterFp,
  characterMaxHp: characterHp,
  characterMaxMp: characterMp,
  currentCharacterFp,
  currentCharacterHp,
  currentCharacterMp,
  onConsumeInventoryItem,
  pushBattleLogEntry,
  setBattleState
}: UseRecoveryItemsOptions) {
  const [consumableCooldownReadyAt, setConsumableCooldownReadyAt] =
    useState<ConsumableCooldownState>(emptyConsumableCooldowns);
  const [cooldownNow, setCooldownNow] = useState(() => Date.now());
  const consumableCooldownRemainingByResource: ConsumableCooldownState = {
    fp: Math.max(0, consumableCooldownReadyAt.fp - cooldownNow),
    hp: Math.max(0, consumableCooldownReadyAt.hp - cooldownNow),
    mp: Math.max(0, consumableCooldownReadyAt.mp - cooldownNow)
  };

  useEffect(() => {
    if (Object.values(consumableCooldownReadyAt).every((readyAt) => readyAt <= Date.now())) {
      return undefined;
    }

    const cooldownInterval = window.setInterval(() => {
      setCooldownNow(Date.now());
    }, 100);

    return () => window.clearInterval(cooldownInterval);
  }, [consumableCooldownReadyAt]);

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

  return {
    consumableCooldownRemainingByResource,
    handleUseRecoveryItem
  };
}
