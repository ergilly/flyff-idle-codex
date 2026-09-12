import { fireEvent, render, screen } from "@testing-library/react";
import { QuestLogNavigation } from "./QuestLogNavigation";
import type { ActiveQuest } from "@/lib/api";

const quest = (id: number, name: string): ActiveQuest => ({
  id,
  name,
  type: "category",
  repeatable: false,
  minLevel: 10,
  maxLevel: 190,
  instructions: [],
  objectives: [],
  rewards: []
});

describe("QuestLogNavigation", () => {
  it("keeps completed quests in a collapsed section and allows selecting them", () => {
    const onSelect = jest.fn();
    render(
      <QuestLogNavigation
        activeQuests={[quest(1, "Active Assignment")]}
        completedQuests={[quest(2, "Finished Assignment")]}
        onSelect={onSelect}
        selectedQuestId={1}
      />
    );
    expect(screen.getByText("Completed quests (1)").closest("details")).not.toHaveAttribute("open");
    fireEvent.click(screen.getByText("Completed quests (1)"));
    fireEvent.click(screen.getByRole("button", { name: /Finished Assignment/ }));
    expect(onSelect).toHaveBeenCalledWith(2);
  });
});
