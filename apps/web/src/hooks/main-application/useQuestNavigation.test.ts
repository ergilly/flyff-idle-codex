import { act, renderHook } from "@testing-library/react";
import type { ActiveQuest } from "@/lib/api";
import { useQuestNavigation } from "./useQuestNavigation";

const quest = { id: 129, name: "Blessed Doll" } as ActiveQuest;

describe("useQuestNavigation", () => {
  it("keeps map targets and pinned quests together while navigating", () => {
    const navigate = jest.fn();
    const { result } = renderHook(() => useQuestNavigation(navigate));
    const target = {
      id: "quest-office",
      iconSrc: "/quest-office.png",
      kind: "npc" as const,
      label: "Mikyel",
      npcId: 29,
      townMapId: "flarine-town" as const,
      x: 1,
      y: 2
    };

    act(() => result.current.openMap(target));
    expect(result.current.mapTarget).toEqual(target);
    expect(navigate).toHaveBeenCalledWith("Map");

    act(() => result.current.pinQuest(quest));
    expect(result.current.pinnedQuest).toBe(quest);

    act(() => result.current.openQuestLog());
    expect(result.current.mapTarget).toBeUndefined();
    expect(navigate).toHaveBeenCalledWith("Quests");
  });
});
