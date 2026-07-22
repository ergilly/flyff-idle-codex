"use client";

import { useState } from "react";
import { Panel } from "@/components/atoms/Panel";
import { QuestLogNavigation } from "@/components/molecules/main-application/QuestLogNavigation";
import { QuestObjectivesSection } from "@/components/molecules/main-application/QuestObjectivesSection";
import { SectionHeading } from "@/components/molecules/main-application/SectionHeading";
import type { ActiveQuest, CharacterInventoryItem } from "@/lib/api";
import type { CharacterProgressionRank } from "@/lib/characterProgression";
import { cx } from "@/lib/classNames";
import {
  formatQuestExperiencePercentage,
  getQuestExperiencePercentage,
  getQuestExperienceReward
} from "@/lib/questExperience";

type QuestLogPanelProps = {
  characterLevel: number;
  characterProgressionRank: CharacterProgressionRank;
  completedQuests?: ActiveQuest[];
  inventoryItems?: CharacterInventoryItem[];
  onAbandonQuest?: (questId: number) => Promise<void>;
  quests: ActiveQuest[];
};

export function QuestLogPanel({
  characterLevel,
  characterProgressionRank,
  completedQuests = [],
  inventoryItems = [],
  onAbandonQuest,
  quests
}: QuestLogPanelProps) {
  const [abandonError, setAbandonError] = useState("");
  const [confirmAbandonQuestId, setConfirmAbandonQuestId] = useState<number | null>(null);
  const [pendingAbandonQuestId, setPendingAbandonQuestId] = useState<number | null>(null);
  const [selectedQuestId, setSelectedQuestId] = useState<number | null>(null);
  const allQuests = [...quests, ...completedQuests];
  const selectedQuest = allQuests.find((quest) => quest.id === selectedQuestId) ?? allQuests[0];
  const selectedQuestIsCompleted = completedQuests.some((quest) => quest.id === selectedQuest?.id);

  async function abandonQuest(questId: number) {
    if (!onAbandonQuest) return;
    setAbandonError("");
    setPendingAbandonQuestId(questId);

    try {
      await onAbandonQuest(questId);
      setConfirmAbandonQuestId(null);
    } catch (error) {
      setAbandonError(error instanceof Error ? error.message : "Unable to abandon quest");
    } finally {
      setPendingAbandonQuestId(null);
    }
  }

  if (!selectedQuest) {
    return (
      <Panel as="section" className="place-items-center py-14 text-center" data-testid="quests_panel_empty">
        <SectionHeading eyebrow="Quest Log" title="No active quests" />
        <p className="max-w-md text-sm text-text-muted">
          Visit a Quest Office on the Map to review and accept an available quest.
        </p>
      </Panel>
    );
  }

  return (
    <section
      className="grid h-full min-h-0 grid-cols-[minmax(260px,0.8fr)_minmax(0,2fr)] gap-4 max-[900px]:grid-cols-1"
      data-testid="quests_section_log"
    >
      <QuestLogNavigation
        activeQuests={quests}
        completedQuests={completedQuests}
        onSelect={(questId) => {
          setAbandonError("");
          setConfirmAbandonQuestId(null);
          setSelectedQuestId(questId);
        }}
        selectedQuestId={selectedQuest.id}
      />

      <Panel as="article" className="min-h-0 content-start gap-5 overflow-y-auto">
        <header className="grid gap-2 border-b-2 border-border pb-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-primary-strong">
                {selectedQuestIsCompleted ? "Completed quest" : "Active quest"}
              </p>
              <h2 className="text-2xl font-black text-foreground">{selectedQuest.name}</h2>
            </div>
            <span
              className={cx(
                "rounded-full px-3 py-1 text-xs font-black uppercase",
                selectedQuestIsCompleted
                  ? "bg-panel-muted text-text-muted grayscale"
                  : "bg-primary text-background"
              )}
            >
              {selectedQuestIsCompleted ? "Completed" : "Active"}
            </span>
          </div>
          <p className="text-sm leading-6 text-text-muted">
            {selectedQuest.description || "No quest description is available."}
          </p>
        </header>

        <QuestObjectivesSection inventoryItems={inventoryItems} objectives={selectedQuest.objectives} />

        {selectedQuest.instructions.length > 0 ? (
          <QuestDetailSection title="Instructions" values={selectedQuest.instructions} />
        ) : null}

        <section className="grid gap-2">
          <h3 className="text-sm font-black uppercase tracking-wide text-primary-strong">Quest contacts</h3>
          <dl className="grid gap-2 rounded-control border-2 border-border bg-panel-muted p-3 text-sm">
            <QuestContact label="Accepted from" name={selectedQuest.giverName} />
            <QuestContact label="Hand in to" name={selectedQuest.handInName} />
          </dl>
        </section>

        <QuestDetailSection
          title="Rewards"
          values={getQuestRewardLabels(selectedQuest, characterLevel, characterProgressionRank)}
          empty="No listed rewards."
        />

        {onAbandonQuest && !selectedQuestIsCompleted ? (
          <section className="grid gap-2 border-t-2 border-border pt-4">
            {confirmAbandonQuestId === selectedQuest.id ? (
              <div className="grid gap-2 rounded-control border-2 border-danger bg-danger/10 p-3">
                <p className="text-sm font-bold text-foreground">
                  Abandon {selectedQuest.name}? You can accept it again from{" "}
                  {selectedQuest.giverName ?? "its NPC"}.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    className="min-h-10 rounded-control border-2 border-border px-4 font-black text-foreground"
                    disabled={pendingAbandonQuestId !== null}
                    onClick={() => setConfirmAbandonQuestId(null)}
                    type="button"
                  >
                    Cancel
                  </button>
                  <button
                    className="min-h-10 rounded-control bg-danger px-4 font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={pendingAbandonQuestId !== null}
                    onClick={() => void abandonQuest(selectedQuest.id)}
                    type="button"
                  >
                    {pendingAbandonQuestId === selectedQuest.id ? "Abandoning..." : "Confirm abandon"}
                  </button>
                </div>
              </div>
            ) : (
              <button
                className="min-h-10 justify-self-start rounded-control border-2 border-danger px-4 font-black text-danger transition-colors hover:bg-danger/10"
                onClick={() => {
                  setAbandonError("");
                  setConfirmAbandonQuestId(selectedQuest.id);
                }}
                type="button"
              >
                Abandon quest
              </button>
            )}
            {abandonError ? (
              <p className="text-sm font-bold text-danger" role="alert">
                {abandonError}
              </p>
            ) : null}
          </section>
        ) : null}
      </Panel>
    </section>
  );
}

function getQuestRewardLabels(
  quest: ActiveQuest,
  characterLevel: number,
  characterProgressionRank: CharacterProgressionRank
) {
  const minimumPercentage = getQuestExperiencePercentage(quest.experiencePercentages, quest.minLevel);

  if (minimumPercentage <= 0) return quest.rewards;

  const currentReward = getQuestExperienceReward(quest.experiencePercentages, {
    level: characterLevel,
    progressionRank: characterProgressionRank
  });
  const minimumLabel = `${formatQuestExperiencePercentage(minimumPercentage)}% EXP at level ${quest.minLevel}`;
  const currentLabel =
    currentReward.percentage > 0
      ? characterLevel === quest.minLevel
        ? `${currentReward.experience.toLocaleString()} EXP at your current level`
        : `currently ${formatQuestExperiencePercentage(currentReward.percentage)}% / ${currentReward.experience.toLocaleString()} EXP at level ${characterLevel}`
      : "no EXP at your current level";

  return [...quest.rewards, `${minimumLabel} (${currentLabel})`];
}

function QuestDetailSection({ empty, title, values }: { empty?: string; title: string; values: string[] }) {
  return (
    <section className="grid gap-2">
      <h3 className="text-sm font-black uppercase tracking-wide text-primary-strong">{title}</h3>
      {values.length > 0 ? (
        <ul className="grid gap-2 text-sm text-foreground">
          {values.map((value, index) => (
            <li
              className="rounded-control border border-border bg-panel-muted px-3 py-2"
              key={`${value}-${index}`}
            >
              {value}
            </li>
          ))}
        </ul>
      ) : empty ? (
        <p className="text-sm text-text-muted">{empty}</p>
      ) : null}
    </section>
  );
}

function QuestContact({ label, name }: { label: string; name?: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="font-bold text-text-muted">{label}</dt>
      <dd className="font-black text-foreground">{name ?? "Unknown"}</dd>
    </div>
  );
}
