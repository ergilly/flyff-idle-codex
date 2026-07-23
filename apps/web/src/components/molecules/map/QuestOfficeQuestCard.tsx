import type { QuestOfficeQuest } from "@/lib/api";
import type { ReactNode } from "react";
import { formatQuestExperiencePercentage, getQuestExperiencePercentage } from "@/lib/questExperience";

export type QuestOfficeQuestCardProps = {
  accepted: boolean;
  actionError: string;
  canHandIn: boolean;
  characterLevel?: number;
  completed: boolean;
  dialogueIndex: number;
  expanded: boolean;
  handingIn: boolean;
  onAccept: () => void;
  onComplete: () => void;
  onDecline: () => void;
  onHandIn: () => void;
  onNextDialogue: () => void;
  onToggle: () => void;
  pending: boolean;
  quest: QuestOfficeQuest;
};

export function QuestOfficeQuestCard(props: QuestOfficeQuestCardProps) {
  const { quest } = props;
  const availability = getQuestAvailability(quest, props.characterLevel);
  const dialogues = props.handingIn ? getCompletionDialogues(quest) : getOfferDialogues(quest);
  const currentDialogue = dialogues[Math.min(props.dialogueIndex, dialogues.length - 1)];
  const hasNextDialogue = props.dialogueIndex < dialogues.length - 1;

  return (
    <article
      className={`rounded-control border border-border bg-panel p-3 ${props.completed ? "grayscale" : ""}`}
    >
      <button
        aria-expanded={props.expanded}
        className="flex w-full items-start justify-between gap-3 text-left"
        onClick={props.onToggle}
        type="button"
      >
        <span>
          <span className="block text-sm font-black text-foreground">{quest.name}</span>
          <span className="mt-1 block text-xs text-text-muted">
            Level {formatLevelRange(quest)} | {formatQuestType(quest.type)}
            {quest.repeatable ? " | Repeatable" : ""}
          </span>
        </span>
        <span
          className={`shrink-0 rounded-full px-2 py-1 text-[0.65rem] font-black uppercase ${availability.className}`}
        >
          {props.completed
            ? "Completed"
            : props.canHandIn
              ? "Ready"
              : props.accepted
                ? "Accepted"
                : availability.label}
        </span>
      </button>

      {props.expanded ? (
        <div className="mt-3 grid gap-3 border-t border-border pt-3 text-sm">
          <div className="grid gap-1 text-text-muted">
            <p>{quest.description || "No quest description is available."}</p>
            {quest.endReceiveGold ? (
              <p className="font-bold text-foreground">
                Reward: {quest.endReceiveGold.toLocaleString()} Penya
              </p>
            ) : null}
            {getQuestExperiencePercentage(quest.endReceiveExperience, quest.minLevel) > 0 ? (
              <p className="font-bold text-foreground">
                Reward:{" "}
                {formatQuestExperiencePercentage(
                  getQuestExperiencePercentage(quest.endReceiveExperience, quest.minLevel)
                )}
                % EXP at level {quest.minLevel}
              </p>
            ) : null}
          </div>

          <div className="rounded-control border border-primary bg-panel-muted p-3" aria-live="polite">
            <p className="text-[0.65rem] font-black uppercase tracking-wide text-text-muted">
              {props.dialogueIndex + 1} / {dialogues.length}
            </p>
            <p className="mt-2 text-foreground">{currentDialogue}</p>
          </div>

          {props.completed ? (
            <p className="font-bold text-primary-strong">This quest has been completed.</p>
          ) : props.handingIn && hasNextDialogue ? (
            <ActionButton onClick={props.onNextDialogue}>Next</ActionButton>
          ) : props.handingIn ? (
            <ActionButton disabled={props.pending} onClick={props.onComplete}>
              {props.pending ? "Completing..." : "Complete quest"}
            </ActionButton>
          ) : props.canHandIn ? (
            <ActionButton onClick={props.onHandIn}>Hand in quest</ActionButton>
          ) : props.accepted ? (
            <p className="font-bold text-primary-strong">
              This quest is in the character&apos;s current quests.
            </p>
          ) : hasNextDialogue ? (
            <ActionButton onClick={props.onNextDialogue}>Next</ActionButton>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <button
                className="min-h-10 rounded-control border-2 border-border px-4 font-black text-foreground"
                onClick={props.onDecline}
                type="button"
              >
                Decline
              </button>
              <ActionButton disabled={!availability.available || props.pending} onClick={props.onAccept}>
                {props.pending ? "Accepting..." : "Accept"}
              </ActionButton>
            </div>
          )}
          {props.actionError ? <p className="font-bold text-danger">{props.actionError}</p> : null}
        </div>
      ) : null}
    </article>
  );
}

function ActionButton({
  children,
  disabled = false,
  onClick
}: {
  children: ReactNode;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className="min-h-10 rounded-control bg-primary px-4 font-black text-background disabled:cursor-not-allowed disabled:opacity-50"
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

function getOfferDialogues(quest: QuestOfficeQuest) {
  return quest.dialogsBegin?.filter(Boolean).length
    ? quest.dialogsBegin.filter(Boolean)
    : [quest.description || "Would you like to accept this quest?"];
}

function getCompletionDialogues(quest: QuestOfficeQuest) {
  const dialogues = [quest.descriptionComplete, ...(quest.dialogsComplete ?? [])].filter(
    (dialogue): dialogue is string => Boolean(dialogue)
  );
  return dialogues.length > 0 ? dialogues : ["You have completed this quest."];
}

function getQuestAvailability(quest: QuestOfficeQuest, characterLevel?: number) {
  if (characterLevel === undefined)
    return { available: false, className: "bg-panel-muted text-text-muted", label: "Level unknown" };
  if (characterLevel < quest.minLevel)
    return { available: false, className: "bg-panel-elevated text-accent", label: `Level ${quest.minLevel}` };
  if (characterLevel > quest.maxLevel)
    return { available: false, className: "bg-danger/15 text-danger", label: "Level passed" };
  return { available: true, className: "bg-primary text-background", label: "Available" };
}

function formatLevelRange(quest: QuestOfficeQuest) {
  return quest.minLevel === quest.maxLevel ? String(quest.minLevel) : `${quest.minLevel}-${quest.maxLevel}`;
}

function formatQuestType(type: string) {
  return type ? `${type.charAt(0).toUpperCase()}${type.slice(1)}` : "Quest";
}
