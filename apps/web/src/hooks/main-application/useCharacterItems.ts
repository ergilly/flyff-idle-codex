import { useEffect, useState } from "react";
import { getEquippedItemIds, getChangedEquipmentSlot } from "@/lib/characterEquipment";
import {
  equipConsumableItem,
  equipInventoryItem,
  fetchItems,
  moveInventoryItem,
  sortInventory,
  unequipItem,
  type Character,
  type CharacterEquipmentSlot,
  type InventorySortOption,
  type ItemMetadata,
  type MapMonsterFamily
} from "@/lib/api";

type UseCharacterItemsOptions = {
  onAuthenticationRequired: () => void;
  selectedCharacter: Character | null;
  selectedMonsterFamily: MapMonsterFamily | null;
  updateCharacter: (character: Character) => void;
};

export function useCharacterItems({
  onAuthenticationRequired,
  selectedCharacter,
  selectedMonsterFamily,
  updateCharacter
}: UseCharacterItemsOptions) {
  const [itemsById, setItemsById] = useState<Record<string, ItemMetadata>>({});
  const [activeEquipmentSet, setActiveEquipmentSet] = useState(0);
  const [selectedEquipmentSlot, setSelectedEquipmentSlot] = useState<CharacterEquipmentSlot | null>(null);
  const [selectedInventorySlotIndex, setSelectedInventorySlotIndex] = useState<number | null>(null);
  const [itemActionError, setItemActionError] = useState("");
  const [isItemActionPending, setIsItemActionPending] = useState(false);

  useEffect(() => {
    setActiveEquipmentSet(0);
  }, [selectedCharacter]);

  useEffect(() => {
    setItemsById({});
  }, [selectedCharacter?.id]);

  useEffect(() => {
    if (!selectedCharacter) {
      setItemsById({});
      setSelectedEquipmentSlot(null);
      setSelectedInventorySlotIndex(null);
      return;
    }

    const token = localStorage.getItem("flyffIdleToken");
    const itemIds = [
      ...getEquippedItemIds(selectedCharacter),
      ...Object.values(selectedCharacter.consumableLoadout ?? {}).flatMap((item) =>
        item ? [item.itemId] : []
      ),
      ...selectedCharacter.inventory.items.map((item) => item.itemId),
      ...(selectedMonsterFamily?.variants?.flatMap(
        (variant) => variant.drops?.map((drop) => String(drop.item)) ?? []
      ) ?? [])
    ];
    let ignoreResult = false;

    if (!token) {
      setItemsById({});
      setSelectedEquipmentSlot(null);
      setSelectedInventorySlotIndex(null);
      return;
    }

    if (itemIds.length === 0) {
      setSelectedEquipmentSlot(null);
      setSelectedInventorySlotIndex(null);
      return;
    }

    fetchItems(token, itemIds)
      .then((items) => {
        if (!ignoreResult) {
          setItemsById((currentItems) => ({
            ...currentItems,
            ...Object.fromEntries(items.map((item) => [item.id, item]))
          }));
        }
      })
      .catch(() => {
        if (!ignoreResult) {
          // Retain metadata already loaded for this character when a refresh fails.
        }
      });

    return () => {
      ignoreResult = true;
    };
  }, [selectedCharacter, selectedMonsterFamily]);

  useEffect(() => {
    if (!selectedCharacter || !selectedEquipmentSlot) {
      return;
    }

    const selectedEquipment =
      selectedCharacter.equipmentSets?.[activeEquipmentSet] ?? selectedCharacter.equipment;

    if (!selectedEquipment[selectedEquipmentSlot]) {
      setSelectedEquipmentSlot(null);
    }
  }, [activeEquipmentSet, selectedCharacter, selectedEquipmentSlot]);

  function handleEquipmentSetChange(equipmentSet: number) {
    setActiveEquipmentSet(equipmentSet);
    setSelectedEquipmentSlot(null);
  }

  useEffect(() => {
    if (!selectedCharacter || selectedInventorySlotIndex === null) {
      return;
    }

    if (!selectedCharacter.inventory.items.some((item) => item.slotIndex === selectedInventorySlotIndex)) {
      setSelectedInventorySlotIndex(null);
    }
  }, [selectedCharacter, selectedInventorySlotIndex]);

  function handleSelectEquipmentSlot(slot: CharacterEquipmentSlot) {
    setItemActionError("");
    setSelectedEquipmentSlot(slot);
  }

  function handleSelectInventorySlot(slotIndex: number | null) {
    setItemActionError("");
    setSelectedInventorySlotIndex(slotIndex);
  }

  async function handleEquipInventorySlot(slotIndex: number, equipmentSet: number) {
    if (!selectedCharacter) {
      return;
    }

    const token = localStorage.getItem("flyffIdleToken");

    if (!token) {
      onAuthenticationRequired();
      return;
    }

    setItemActionError("");
    setIsItemActionPending(true);

    try {
      const updatedCharacter = await equipInventoryItem(token, selectedCharacter.id, slotIndex, equipmentSet);
      updateCharacter(updatedCharacter);
      setSelectedInventorySlotIndex(null);
      setActiveEquipmentSet(equipmentSet);
      setSelectedEquipmentSlot(getChangedEquipmentSlot(selectedCharacter, updatedCharacter, equipmentSet));
    } catch (equipError) {
      setItemActionError(equipError instanceof Error ? equipError.message : "Unable to equip item");
    } finally {
      setIsItemActionPending(false);
    }
  }

  async function handleEquipConsumableItem(resource: "hp" | "mp" | "fp", slotIndex: number | null) {
    if (!selectedCharacter) {
      return;
    }

    const token = localStorage.getItem("flyffIdleToken");

    if (!token) {
      onAuthenticationRequired();
      return;
    }

    try {
      const updatedCharacter = await equipConsumableItem(token, selectedCharacter.id, resource, slotIndex);
      updateCharacter(updatedCharacter);
    } catch (equipError) {
      setItemActionError(equipError instanceof Error ? equipError.message : "Unable to equip consumable");
    }
  }

  async function handleMoveInventoryItem(fromSlotIndex: number, toSlotIndex: number) {
    if (!selectedCharacter || fromSlotIndex === toSlotIndex) {
      return;
    }

    const token = localStorage.getItem("flyffIdleToken");

    if (!token) {
      onAuthenticationRequired();
      return;
    }

    setItemActionError("");
    setIsItemActionPending(true);

    try {
      const updatedCharacter = await moveInventoryItem(
        token,
        selectedCharacter.id,
        fromSlotIndex,
        toSlotIndex
      );
      updateCharacter(updatedCharacter);
      setSelectedInventorySlotIndex(toSlotIndex);
    } catch (moveError) {
      setItemActionError(moveError instanceof Error ? moveError.message : "Unable to move item");
    } finally {
      setIsItemActionPending(false);
    }
  }

  async function handleSortInventory(sortBy: InventorySortOption) {
    if (!selectedCharacter) {
      return;
    }

    const token = localStorage.getItem("flyffIdleToken");

    if (!token) {
      onAuthenticationRequired();
      return;
    }

    setItemActionError("");
    setIsItemActionPending(true);

    try {
      const updatedCharacter = await sortInventory(token, selectedCharacter.id, sortBy);
      updateCharacter(updatedCharacter);
      setSelectedInventorySlotIndex(null);
    } catch (sortError) {
      setItemActionError(sortError instanceof Error ? sortError.message : "Unable to sort inventory");
    } finally {
      setIsItemActionPending(false);
    }
  }

  async function handleUnequipEquipmentSlot(equipmentSlot: CharacterEquipmentSlot, equipmentSet: number) {
    if (!selectedCharacter) {
      return;
    }

    const token = localStorage.getItem("flyffIdleToken");

    if (!token) {
      onAuthenticationRequired();
      return;
    }

    setItemActionError("");
    setIsItemActionPending(true);

    try {
      const updatedCharacter = await unequipItem(token, selectedCharacter.id, equipmentSlot, equipmentSet);
      updateCharacter(updatedCharacter);
      setSelectedEquipmentSlot(null);
    } catch (unequipError) {
      setItemActionError(unequipError instanceof Error ? unequipError.message : "Unable to unequip item");
    } finally {
      setIsItemActionPending(false);
    }
  }

  return {
    activeEquipmentSet,
    handleEquipmentSetChange,
    handleEquipConsumableItem,
    handleEquipInventorySlot,
    handleMoveInventoryItem,
    handleSelectEquipmentSlot,
    handleSelectInventorySlot,
    handleSortInventory,
    handleUnequipEquipmentSlot,
    isItemActionPending,
    itemActionError,
    itemsById,
    selectedEquipmentSlot,
    selectedInventorySlotIndex,
    setItemActionError
  };
}
