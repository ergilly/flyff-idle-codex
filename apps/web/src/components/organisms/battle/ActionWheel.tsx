"use client";

import Image from "next/image";
import { Swords } from "lucide-react";
import { useMemo, useRef, type DragEvent } from "react";
import {
  actionSlotDragDataType,
  actionSlotPositions,
  getDraggedActionSlotIndex,
  getSkillIconSrc,
  skillDragDataType
} from "@/lib/battle/actionSlots";
import { type ActionSlot } from "@/lib/battle/types";
import { cx } from "@/lib/classNames";
import { type SkillDefinition } from "@/lib/skillTrees";

export function ActionWheel({
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
