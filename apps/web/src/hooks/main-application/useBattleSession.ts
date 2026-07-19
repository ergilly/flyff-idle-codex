import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import {
  consumeEquippedArrow,
  consumeEquippedConsumableItem,
  lootInventoryItems,
  updateCharacterProgression,
  type Character,
  type ItemMetadata
} from "@/lib/api";
import { type BattlePersistenceState, type CharacterResourceState } from "@/lib/battle/types";
import { getCombatStats } from "@/lib/combatStats";

const passiveHpRegenIntervalMs = 5000;
const passiveHpRegenRate = 0.05;

function getMaxHp(character: Character, itemsById: Record<string, ItemMetadata>, activeEquipmentSet: number) {
  const value = getCombatStats(character, itemsById, activeEquipmentSet).find(
    (stat) => stat.label === "Max HP"
  )?.value;
  const numberValue =
    typeof value === "number" ? value : Number.parseFloat(String(value ?? "0").replace(/[^\d.-]/g, ""));

  return Number.isFinite(numberValue) ? numberValue : 0;
}

type UseBattleSessionOptions = {
  activeEquipmentSet: number;
  isCombatViewActive: boolean;
  itemsById: Record<string, ItemMetadata>;
  onAuthenticationRequired: () => void;
  selectedCharacter: Character | null;
  setError: Dispatch<SetStateAction<string>>;
  setItemActionError: Dispatch<SetStateAction<string>>;
  updateCharacter: (character: Character) => void;
};

export function useBattleSession({
  activeEquipmentSet,
  isCombatViewActive,
  itemsById,
  onAuthenticationRequired,
  selectedCharacter,
  setError,
  setItemActionError,
  updateCharacter
}: UseBattleSessionOptions) {
  const [characterResourcesById, setCharacterResourcesById] = useState<
    Record<string, CharacterResourceState>
  >({});
  const [battleStateByCharacterId, setBattleStateByCharacterId] = useState<
    Record<string, BattlePersistenceState>
  >({});

  useEffect(() => {
    if (!selectedCharacter || isCombatViewActive) {
      return undefined;
    }

    const currentResources = characterResourcesById[selectedCharacter.id];

    if (!currentResources) {
      return undefined;
    }

    const maxHp = getMaxHp(selectedCharacter, itemsById, activeEquipmentSet);

    if (maxHp <= 0 || currentResources.hp >= maxHp) {
      return undefined;
    }

    const regenAmount = Math.max(1, Math.floor(maxHp * passiveHpRegenRate));
    const regenInterval = window.setInterval(() => {
      setCharacterResourcesById((currentResourcesById) => {
        const resources = currentResourcesById[selectedCharacter.id];

        if (!resources || resources.hp >= maxHp) {
          return currentResourcesById;
        }

        return {
          ...currentResourcesById,
          [selectedCharacter.id]: {
            ...resources,
            hp: Math.min(maxHp, resources.hp + regenAmount)
          }
        };
      });
    }, passiveHpRegenIntervalMs);

    return () => window.clearInterval(regenInterval);
  }, [activeEquipmentSet, isCombatViewActive, characterResourcesById, itemsById, selectedCharacter]);

  async function handleUpdateCharacterProgression(progression: {
    exp?: number;
    level?: number;
    penya?: number;
  }) {
    if (!selectedCharacter) {
      return;
    }

    const token = localStorage.getItem("flyffIdleToken");

    if (!token) {
      onAuthenticationRequired();
      return;
    }

    try {
      const updatedCharacter = await updateCharacterProgression(token, selectedCharacter.id, progression);
      updateCharacter(updatedCharacter);
    } catch {
      setError("Unable to save character progression.");
    }
  }

  async function handleLootInventoryItems(items: Array<{ itemId: string; quantity: number }>) {
    if (!selectedCharacter) {
      return;
    }

    const token = localStorage.getItem("flyffIdleToken");

    if (!token) {
      onAuthenticationRequired();
      return;
    }

    const updatedCharacter = await lootInventoryItems(token, selectedCharacter.id, items);

    updateCharacter(updatedCharacter);
  }

  async function handleConsumeInventoryItem(resource: "hp" | "mp" | "fp") {
    if (!selectedCharacter) {
      return;
    }

    const token = localStorage.getItem("flyffIdleToken");

    if (!token) {
      onAuthenticationRequired();
      return;
    }

    try {
      const updatedCharacter = await consumeEquippedConsumableItem(token, selectedCharacter.id, resource);
      updateCharacter(updatedCharacter);
    } catch (consumeError) {
      setItemActionError(
        consumeError instanceof Error ? consumeError.message : "Unable to consume equipped item"
      );
    }
  }

  async function handleConsumeEquippedArrow(equipmentSet: number) {
    if (!selectedCharacter) {
      return null;
    }

    const token = localStorage.getItem("flyffIdleToken");

    if (!token) {
      onAuthenticationRequired();
      return null;
    }

    try {
      const updatedCharacter = await consumeEquippedArrow(token, selectedCharacter.id, equipmentSet);
      updateCharacter(updatedCharacter);
      return (
        updatedCharacter.ammoQuantities?.[equipmentSet] ??
        (equipmentSet === 0 ? (updatedCharacter.ammoQuantity ?? 0) : 0)
      );
    } catch (consumeError) {
      setItemActionError(
        consumeError instanceof Error ? consumeError.message : "Unable to consume equipped arrow"
      );
      return null;
    }
  }

  function handleCharacterResourcesChange(resources: CharacterResourceState) {
    if (!selectedCharacter) {
      return;
    }

    setCharacterResourcesById((currentResourcesById) => {
      const currentResources = currentResourcesById[selectedCharacter.id];

      if (
        currentResources?.fp === resources.fp &&
        currentResources.hp === resources.hp &&
        currentResources.mp === resources.mp
      ) {
        return currentResourcesById;
      }

      return {
        ...currentResourcesById,
        [selectedCharacter.id]: resources
      };
    });
  }

  function handleBattleStateChange(battleState: BattlePersistenceState) {
    if (!selectedCharacter) {
      return;
    }

    setBattleStateByCharacterId((currentBattleStateByCharacterId) => {
      const currentBattleState = currentBattleStateByCharacterId[selectedCharacter.id];

      if (
        currentBattleState &&
        JSON.stringify(currentBattleState.droppedItems) === JSON.stringify(battleState.droppedItems) &&
        JSON.stringify(currentBattleState.log) === JSON.stringify(battleState.log)
      ) {
        return currentBattleStateByCharacterId;
      }

      return {
        ...currentBattleStateByCharacterId,
        [selectedCharacter.id]: battleState
      };
    });
  }

  return {
    battleStateByCharacterId,
    characterResourcesById,
    handleBattleStateChange,
    handleCharacterResourcesChange,
    handleConsumeInventoryItem,
    handleConsumeEquippedArrow,
    handleLootInventoryItems,
    handleUpdateCharacterProgression
  };
}
