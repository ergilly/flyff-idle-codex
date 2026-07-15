import { type DragEvent } from "react";
import { type ActionSlot } from "@/lib/battle/types";
import { type SkillCombo, type SkillDefinition } from "@/lib/skillTrees";

export const actionSlotPositions = [
  { left: "50%", top: "18%" },
  { left: "73%", top: "34%" },
  { left: "73%", top: "62%" },
  { left: "50%", top: "78%" },
  { left: "27%", top: "62%" },
  { left: "27%", top: "34%" }
];

export const actionSlotFillOrder = [3, 2, 1, 0, 5, 4];
export const skillDragDataType = "application/x-flyff-skill-id";
export const actionSlotDragDataType = "application/x-flyff-action-slot-index";

export function getSkillIconSrc(skill: SkillDefinition) {
  return `https://api.flyff.com/image/skill/colored/${skill.icon}`;
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

export function getActionSequence(slots: ActionSlot[]) {
  return actionSlotFillOrder
    .map((slotIndex) => slots[slotIndex])
    .filter((skill): skill is SkillDefinition => Boolean(skill));
}

export function getActionSequenceIndex(slotIndex: number) {
  return actionSlotFillOrder.indexOf(slotIndex);
}

export function createActionSlotsFromSequence(skills: SkillDefinition[]) {
  const nextSlots: ActionSlot[] = Array.from({ length: actionSlotPositions.length }, () => null);

  skills.forEach((skill, index) => {
    const slotIndex = actionSlotFillOrder[index];

    if (slotIndex !== undefined) {
      nextSlots[slotIndex] = skill;
    }
  });

  return nextSlots;
}

export function canUseActionSequence(skills: SkillDefinition[]) {
  return skills.length <= actionSlotFillOrder.length && isValidActionSequence(skills);
}

export function getDraggedActionSlotIndex(event: DragEvent<HTMLElement>) {
  const slotIndex = event.dataTransfer.getData(actionSlotDragDataType);

  return slotIndex === "" ? null : Number(slotIndex);
}
