import { useState } from "react";
import {
  addCharacterInventoryItem,
  addCharacterPenya,
  refundCharacterSkills,
  refundCharacterStats,
  type Character
} from "@/lib/api";

type UseAdminActionsOptions = {
  handleResetSkills: () => void;
  handleSelectInventorySlot: (slotIndex: number | null) => void;
  onAuthenticationRequired: () => void;
  resetProgressionForms: () => void;
  selectedCharacter: Character | null;
  updateCharacter: (character: Character) => void;
};

export function useAdminActions({
  handleResetSkills,
  handleSelectInventorySlot,
  onAuthenticationRequired,
  resetProgressionForms,
  selectedCharacter,
  updateCharacter
}: UseAdminActionsOptions) {
  const [adminError, setAdminError] = useState("");
  const [refundingAdminAction, setRefundingAdminAction] = useState<"stats" | "skills" | null>(null);
  const [isAddingInventoryItem, setIsAddingInventoryItem] = useState(false);
  const [isAddingPenya, setIsAddingPenya] = useState(false);

  async function handleRefundStats() {
    if (!selectedCharacter) {
      return;
    }

    const token = localStorage.getItem("flyffIdleToken");

    if (!token) {
      onAuthenticationRequired();
      return;
    }

    setAdminError("");
    setRefundingAdminAction("stats");

    try {
      const updatedCharacter = await refundCharacterStats(token, selectedCharacter.id);
      updateCharacter(updatedCharacter);
      resetProgressionForms();
    } catch (refundError) {
      setAdminError(refundError instanceof Error ? refundError.message : "Unable to refund points");
    } finally {
      setRefundingAdminAction(null);
    }
  }

  async function handleRefundSkills() {
    if (!selectedCharacter) {
      return;
    }

    const token = localStorage.getItem("flyffIdleToken");

    if (!token) {
      onAuthenticationRequired();
      return;
    }

    setAdminError("");
    setRefundingAdminAction("skills");

    try {
      const updatedCharacter = await refundCharacterSkills(token, selectedCharacter.id);
      updateCharacter(updatedCharacter);
      handleResetSkills();
    } catch (refundError) {
      setAdminError(refundError instanceof Error ? refundError.message : "Unable to refund points");
    } finally {
      setRefundingAdminAction(null);
    }
  }

  async function handleAddInventoryItem(itemId: string, quantity: number) {
    if (!selectedCharacter) {
      return;
    }

    const token = localStorage.getItem("flyffIdleToken");

    if (!token) {
      onAuthenticationRequired();
      return;
    }

    setAdminError("");
    setIsAddingInventoryItem(true);

    try {
      const previousInventoryItemsBySlot = new Map(
        selectedCharacter.inventory.items.map((item) => [item.slotIndex, item])
      );
      const updatedCharacter = await addCharacterInventoryItem(token, selectedCharacter.id, {
        itemId,
        quantity
      });
      updateCharacter(updatedCharacter);
      const addedItem = [...updatedCharacter.inventory.items].reverse().find((item) => {
        const previousItem = previousInventoryItemsBySlot.get(item.slotIndex);

        return (
          item.itemId === itemId &&
          (!previousItem || previousItem.itemId !== item.itemId || previousItem.quantity !== item.quantity)
        );
      });
      handleSelectInventorySlot(addedItem?.slotIndex ?? null);
    } catch (addItemError) {
      setAdminError(addItemError instanceof Error ? addItemError.message : "Unable to add item");
    } finally {
      setIsAddingInventoryItem(false);
    }
  }

  async function handleAddPenya(amount: number) {
    if (!selectedCharacter) return;

    const token = localStorage.getItem("flyffIdleToken");

    if (!token) {
      onAuthenticationRequired();
      return;
    }

    setAdminError("");
    setIsAddingPenya(true);

    try {
      updateCharacter(await addCharacterPenya(token, selectedCharacter.id, amount));
    } catch (addPenyaError) {
      setAdminError(addPenyaError instanceof Error ? addPenyaError.message : "Unable to add Penya");
    } finally {
      setIsAddingPenya(false);
    }
  }

  return {
    adminError,
    handleAddInventoryItem,
    handleAddPenya,
    handleRefundSkills,
    handleRefundStats,
    isAddingInventoryItem,
    isAddingPenya,
    refundingAdminAction
  };
}
