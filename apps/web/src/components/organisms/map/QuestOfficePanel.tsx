"use client";

import { useEffect, useMemo, useState } from "react";
import { QuestOfficeQuestCard } from "@/components/molecules/map/QuestOfficeQuestCard";
import { fetchQuestOfficeQuests, type CharacterInventory, type QuestOfficeQuest } from "@/lib/api";
import { normalizeQuestItemRequirements } from "@/lib/questItemRequirements";

type QuestOfficePanelProps = {
  activeQuestIds?: number[];
  characterInventory?: CharacterInventory;
  characterLevel?: number;
  completedQuestIds?: number[];
  npcId: number;
  npcName: string;
  onAcceptQuest?: (npcId: number, questId: number) => Promise<void>;
  onCompleteQuest?: (npcId: number, questId: number) => Promise<void>;
};

export function QuestOfficePanel({
  activeQuestIds = [],
  characterInventory,
  characterLevel,
  completedQuestIds = [],
  npcId,
  npcName,
  onAcceptQuest,
  onCompleteQuest
}: QuestOfficePanelProps) {
  const [actionError, setActionError] = useState("");
  const [dialogueIndex, setDialogueIndex] = useState(0);
  const [error, setError] = useState("");
  const [expandedQuestId, setExpandedQuestId] = useState<number | null>(null);
  const [handInQuestId, setHandInQuestId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [locallyAcceptedQuestIds, setLocallyAcceptedQuestIds] = useState<number[]>([]);
  const [locallyCompletedQuestIds, setLocallyCompletedQuestIds] = useState<number[]>([]);
  const [pendingQuestId, setPendingQuestId] = useState<number | null>(null);
  const [quests, setQuests] = useState<QuestOfficeQuest[]>([]);
  const acceptedQuestIds = useMemo(
    () => new Set([...activeQuestIds, ...locallyAcceptedQuestIds]),
    [activeQuestIds, locallyAcceptedQuestIds]
  );
  const completedQuestIdSet = useMemo(
    () => new Set([...completedQuestIds, ...locallyCompletedQuestIds]),
    [completedQuestIds, locallyCompletedQuestIds]
  );
  const currentQuests = quests.filter((quest) => !completedQuestIdSet.has(quest.id));
  const completedQuests = quests.filter((quest) => completedQuestIdSet.has(quest.id));

  useEffect(() => {
    let isCurrent = true;
    setError("");
    setIsLoading(true);
    setQuests([]);

    void fetchQuestOfficeQuests(npcId)
      .then((loadedQuests) => {
        if (isCurrent) setQuests(loadedQuests);
      })
      .catch((loadError: unknown) => {
        if (isCurrent) setError(loadError instanceof Error ? loadError.message : "Unable to load quests");
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [npcId]);

  function toggleQuest(questId: number) {
    setActionError("");
    setDialogueIndex(0);
    setHandInQuestId(null);
    setExpandedQuestId((currentQuestId) => (currentQuestId === questId ? null : questId));
  }

  function declineQuest() {
    setActionError("");
    setDialogueIndex(0);
    setExpandedQuestId(null);
  }

  async function acceptQuest(questId: number) {
    if (!onAcceptQuest) return;
    setActionError("");
    setPendingQuestId(questId);

    try {
      await onAcceptQuest(npcId, questId);
      setLocallyAcceptedQuestIds((questIds) => [...new Set([...questIds, questId])]);
    } catch (acceptError) {
      setActionError(acceptError instanceof Error ? acceptError.message : "Unable to accept quest");
    } finally {
      setPendingQuestId(null);
    }
  }

  async function completeQuest(questId: number) {
    if (!onCompleteQuest) return;
    setActionError("");
    setPendingQuestId(questId);

    try {
      await onCompleteQuest(npcId, questId);
      setLocallyAcceptedQuestIds((questIds) => questIds.filter((id) => id !== questId));
      setLocallyCompletedQuestIds((questIds) => [...new Set([...questIds, questId])]);
      setHandInQuestId(null);
      setDialogueIndex(0);
    } catch (completionError) {
      setActionError(completionError instanceof Error ? completionError.message : "Unable to complete quest");
    } finally {
      setPendingQuestId(null);
    }
  }

  function renderQuestCard(quest: QuestOfficeQuest) {
    return (
      <QuestOfficeQuestCard
        actionError={expandedQuestId === quest.id ? actionError : ""}
        accepted={acceptedQuestIds.has(quest.id)}
        canHandIn={
          acceptedQuestIds.has(quest.id) &&
          !completedQuestIdSet.has(quest.id) &&
          canHandInItemQuest(quest, npcId, characterInventory)
        }
        characterLevel={characterLevel}
        dialogueIndex={expandedQuestId === quest.id ? dialogueIndex : 0}
        expanded={expandedQuestId === quest.id}
        completed={completedQuestIdSet.has(quest.id)}
        handingIn={handInQuestId === quest.id}
        key={quest.id}
        onAccept={() => void acceptQuest(quest.id)}
        onDecline={declineQuest}
        onComplete={() => void completeQuest(quest.id)}
        onHandIn={() => {
          setActionError("");
          setDialogueIndex(0);
          setHandInQuestId(quest.id);
        }}
        onNextDialogue={() => setDialogueIndex((index) => index + 1)}
        onToggle={() => toggleQuest(quest.id)}
        pending={pendingQuestId === quest.id}
        quest={quest}
      />
    );
  }

  return (
    <section className="grid gap-3" data-testid="map_section_quest_office">
      <header className="rounded-control border-2 border-primary bg-panel-muted p-4">
        <p className="text-[0.65rem] font-black uppercase tracking-wide text-text-muted">Quest Office</p>
        <h3 className="text-lg font-black text-foreground">{npcName}</h3>
        <p className="mt-1 text-sm text-text-muted">Select a quest to review its details and dialogue.</p>
      </header>

      {isLoading ? <QuestOfficeState message="Loading quests..." /> : null}
      {error ? <QuestOfficeState message={error} /> : null}
      {!isLoading && !error && quests.length === 0 ? (
        <QuestOfficeState message="No quests are connected to this NPC." />
      ) : null}
      {!isLoading && !error && quests.length > 0 ? (
        <div className="grid gap-2">
          <p className="text-xs font-black uppercase tracking-wide text-text-muted">
            {currentQuests.length} available {currentQuests.length === 1 ? "quest" : "quests"}
          </p>
          {currentQuests.map(renderQuestCard)}
          {completedQuests.length > 0 ? (
            <details className="mt-2 rounded-control border border-border bg-panel-muted p-3 opacity-70">
              <summary className="cursor-pointer text-xs font-black uppercase tracking-wide text-text-muted">
                Completed quests ({completedQuests.length})
              </summary>
              <div className="mt-3 grid gap-2">{completedQuests.map(renderQuestCard)}</div>
            </details>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function canHandInItemQuest(quest: QuestOfficeQuest, npcId: number, inventory?: CharacterInventory) {
  const requirements = normalizeQuestItemRequirements(quest.endNeededItems);
  if (quest.endNPC !== npcId || requirements.length === 0 || !inventory) return false;

  const quantityByItemId = inventory.items.reduce<Map<string, number>>((quantities, item) => {
    quantities.set(item.itemId, (quantities.get(item.itemId) ?? 0) + item.quantity);
    return quantities;
  }, new Map());

  return requirements.every(({ count, item }) => (quantityByItemId.get(String(item)) ?? 0) >= count);
}

function QuestOfficeState({ message }: { message: string }) {
  return (
    <div className="rounded-control border-2 border-dashed border-border bg-panel-muted p-4 text-sm text-text-muted">
      {message}
    </div>
  );
}
