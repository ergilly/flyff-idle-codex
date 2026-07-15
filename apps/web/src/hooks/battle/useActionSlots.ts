import { useState } from "react";
import {
  actionSlotFillOrder,
  canUseActionSequence,
  createActionSlotsFromSequence,
  getActionSequence,
  getActionSequenceIndex
} from "@/lib/battle/actionSlots";
import { type ActionSlot } from "@/lib/battle/types";
import { type SkillDefinition } from "@/lib/skillTrees";

export function useActionSlots() {
  const [selectedActionSlotIndex, setSelectedActionSlotIndex] = useState(actionSlotFillOrder[0]);
  const [actionSlots, setActionSlots] = useState<ActionSlot[]>(() =>
    Array.from({ length: actionSlotFillOrder.length }, () => null)
  );

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

  return {
    actionSlots,
    addSkillToFirstAvailableSlot,
    insertSkillAtActionSlot,
    moveActionSlot,
    removeActionSlot,
    selectedActionSlotIndex,
    setSelectedActionSlotIndex
  };
}
