import { useState } from "react";
import type { ActiveQuest } from "@/lib/api";
import type { TownMapLocationTarget } from "@/lib/townMapLocations";

type QuestNavigationDestination = "Map" | "Quests";

export function useQuestNavigation(navigate: (destination: QuestNavigationDestination) => void) {
  const [mapTarget, setMapTarget] = useState<TownMapLocationTarget>();
  const [pinnedQuest, setPinnedQuest] = useState<ActiveQuest | null>(null);

  return {
    mapTarget,
    openMap: (target?: TownMapLocationTarget) => {
      setMapTarget(target);
      navigate("Map");
    },
    openQuestLog: () => {
      setMapTarget(undefined);
      navigate("Quests");
    },
    pinQuest: setPinnedQuest,
    pinnedQuest
  };
}
