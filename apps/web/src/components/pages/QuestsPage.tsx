"use client";

import { useEffect, useState } from "react";
import { ErrorMessage } from "@/components/atoms/ErrorMessage";
import { MutedText } from "@/components/atoms/MutedText";
import { QuestLogPanel } from "@/components/organisms/main-application/QuestLogPanel";
import { fetchActiveQuests, type ActiveQuest, type CharacterInventoryItem } from "@/lib/api";
import type { CharacterProgressionRank } from "@/lib/characterProgression";

type QuestsPageProps = {
  activeQuestIds?: number[];
  characterLevel: number;
  characterProgressionRank: CharacterProgressionRank;
  completedQuestIds?: number[];
  inventoryItems?: CharacterInventoryItem[];
  onAbandonQuest?: (questId: number) => Promise<void>;
};

export function QuestsPage({
  activeQuestIds = [],
  characterLevel,
  characterProgressionRank,
  completedQuestIds = [],
  inventoryItems = [],
  onAbandonQuest
}: QuestsPageProps) {
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [quests, setQuests] = useState<ActiveQuest[]>([]);
  const questIdsKey = activeQuestIds.join(",");
  const completedQuestIdsKey = completedQuestIds.join(",");

  useEffect(() => {
    let isCurrent = true;
    const questIds = Array.from(
      new Set(
        [questIdsKey, completedQuestIdsKey]
          .flatMap((ids) => ids.split(","))
          .filter(Boolean)
          .map(Number)
      )
    );
    setError("");
    setIsLoading(true);

    void fetchActiveQuests(questIds)
      .then((loadedQuests) => {
        if (isCurrent) setQuests(loadedQuests);
      })
      .catch((loadError: unknown) => {
        if (isCurrent) {
          setQuests([]);
          setError(loadError instanceof Error ? loadError.message : "Unable to load active quests");
        }
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [completedQuestIdsKey, questIdsKey]);

  if (isLoading) return <MutedText>Loading active quests...</MutedText>;
  if (error) return <ErrorMessage message={error} testId="quests_error_loading" />;
  const activeQuestIdSet = new Set(activeQuestIds);
  const completedQuestIdSet = new Set(completedQuestIds);
  return (
    <QuestLogPanel
      characterLevel={characterLevel}
      characterProgressionRank={characterProgressionRank}
      completedQuests={quests.filter((quest) => completedQuestIdSet.has(quest.id))}
      inventoryItems={inventoryItems}
      onAbandonQuest={onAbandonQuest}
      quests={quests.filter((quest) => activeQuestIdSet.has(quest.id))}
    />
  );
}
