import { fireEvent, render, screen } from "@testing-library/react";
import type { ActiveQuest } from "@/lib/api";
import { PinnedQuestCard } from "./PinnedQuestCard";

describe("PinnedQuestCard", () => {
  it("shows the next objective and returns to the quest log", () => {
    const onOpenQuestLog = jest.fn();

    render(
      <PinnedQuestCard
        onOpenQuestLog={onOpenQuestLog}
        quest={
          {
            id: 129,
            instructions: [],
            maxLevel: 190,
            minLevel: 23,
            name: "Blessed Doll",
            objectives: [{ kind: "other", label: "Collect the dolls" }],
            repeatable: false,
            rewards: [],
            type: "category"
          } satisfies ActiveQuest
        }
      />
    );

    expect(screen.getByText("Pinned objective")).toBeInTheDocument();
    expect(screen.getByText("Collect the dolls")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Quest log" }));
    expect(onOpenQuestLog).toHaveBeenCalledTimes(1);
  });
});
