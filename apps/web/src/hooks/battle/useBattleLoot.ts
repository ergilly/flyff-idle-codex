import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { type ItemMetadata } from "@/lib/api";
import { removeDroppedItems } from "@/lib/battle/loot";
import {
  type BattleDroppedItem,
  type BattleLogEntry,
  type BattlePageProps,
  type BattleState
} from "@/lib/battle/types";

type UseBattleLootOptions = {
  droppedItems: BattleDroppedItem[];
  itemsById: Record<string, ItemMetadata>;
  onLootInventoryItems: BattlePageProps["onLootInventoryItems"];
  pushBattleLogEntry: (
    currentLog: BattleLogEntry[],
    message: string,
    tone: BattleLogEntry["tone"]
  ) => BattleLogEntry[];
  setBattleState: Dispatch<SetStateAction<BattleState>>;
};

export function useBattleLoot({
  droppedItems,
  itemsById,
  onLootInventoryItems,
  pushBattleLogEntry,
  setBattleState
}: UseBattleLootOptions) {
  const [selectedDroppedItemId, setSelectedDroppedItemId] = useState<string | null>(null);
  const [isLootPending, setIsLootPending] = useState(false);

  useEffect(() => {
    if (selectedDroppedItemId && !droppedItems.some((drop) => drop.itemId === selectedDroppedItemId)) {
      setSelectedDroppedItemId(null);
    }
  }, [droppedItems, selectedDroppedItemId]);

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
    const selectedDrop = droppedItems.find((drop) => drop.itemId === selectedDroppedItemId);

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

  return {
    handleDeleteDroppedItems,
    handleLootDroppedItems,
    handleLootSelectedDroppedItem,
    isLootPending,
    selectedDroppedItemId,
    setSelectedDroppedItemId
  };
}
