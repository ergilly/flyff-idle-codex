import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QuestLogPanel } from "./QuestLogPanel";
import type { ActiveQuest } from "@/lib/api";

const quests: ActiveQuest[] = [
  {
    id: 129,
    name: "Blessed Doll",
    type: "category",
    repeatable: false,
    minLevel: 23,
    maxLevel: 190,
    description: "Collect presents for the children.",
    giverName: "Mikyel",
    handInName: "Mikyel",
    instructions: ["Collect the dolls from Mia."],
    objectives: [{ itemId: "7166", kind: "item", label: "Collect 7 x Mia Doll", requiredCount: 7 }],
    experiencePercentages: [...Array.from({ length: 22 }, () => 0), 35, 26.7463],
    rewards: ["11,500 Penya"]
  },
  {
    id: 200,
    name: "Second Assignment",
    type: "normal",
    repeatable: true,
    minLevel: 25,
    maxLevel: 25,
    giverName: "Lancomi",
    handInName: "Lancomi",
    instructions: [],
    objectives: [{ kind: "other", label: "Defeat 3 x Mia" }],
    rewards: []
  }
];

describe("QuestLogPanel", () => {
  it("shows the selected active quest's objectives, instructions, contacts, and rewards", () => {
    render(
      <QuestLogPanel
        characterLevel={24}
        characterProgressionRank="normal"
        inventoryItems={[{ slotIndex: 0, itemId: "7166", quantity: 13 }]}
        quests={quests}
      />
    );

    expect(screen.getByRole("heading", { name: "Select a quest" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Blessed Doll" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Blessed Doll/ }));
    expect(screen.getByRole("heading", { name: "Blessed Doll" })).toBeInTheDocument();
    expect(screen.getByText("Collect 7 x Mia Doll")).toBeInTheDocument();
    expect(screen.getByLabelText("Collect 7 x Mia Doll progress")).toHaveTextContent("7/7");
    expect(screen.getByRole("progressbar", { name: "Collect 7 x Mia Doll completion" })).toHaveAttribute(
      "aria-valuenow",
      "7"
    );
    expect(screen.getByText("Collect the dolls from Mia.")).toBeInTheDocument();
    expect(screen.getAllByText("Mikyel")).toHaveLength(2);
    expect(screen.getByText("11,500 Penya")).toBeInTheDocument();
    expect(
      screen.getByText("35% EXP at level 23 (currently 26.7463% / 3,490 EXP at level 24)")
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Second Assignment/ }));
    expect(screen.getByRole("heading", { name: "Second Assignment" })).toBeInTheDocument();
    expect(screen.getByText("Defeat 3 x Mia")).toBeInTheDocument();
    expect(screen.getByText("No listed rewards.")).toBeInTheDocument();
  });

  it("provides an empty state when the character has no active quests", () => {
    render(<QuestLogPanel characterLevel={23} characterProgressionRank="normal" quests={[]} />);
    expect(screen.getByRole("heading", { name: "No active quests" })).toBeInTheDocument();
    expect(screen.getByText(/Visit a Quest Office/)).toBeInTheDocument();
  });

  it("confirms before abandoning the selected quest", async () => {
    const onAbandonQuest = jest.fn().mockResolvedValue(undefined);
    render(
      <QuestLogPanel
        characterLevel={23}
        characterProgressionRank="normal"
        onAbandonQuest={onAbandonQuest}
        quests={[quests[0]]}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /Blessed Doll/ }));
    fireEvent.click(screen.getByRole("button", { name: "Abandon quest" }));
    expect(screen.getByText(/You can accept it again from Mikyel/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("button", { name: "Confirm abandon" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Abandon quest" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm abandon" }));
    await waitFor(() => expect(onAbandonQuest).toHaveBeenCalledWith(129));
  });

  it("shows completed quest details without an abandon action", () => {
    render(
      <QuestLogPanel
        characterLevel={23}
        characterProgressionRank="normal"
        completedQuests={[quests[0]]}
        onAbandonQuest={jest.fn()}
        quests={[]}
      />
    );

    fireEvent.click(screen.getByText("Completed quests (1)"));
    fireEvent.click(screen.getByRole("button", { name: /Blessed Doll/ }));
    expect(screen.getByText("Completed quest")).toBeInTheDocument();
    expect(screen.getByText("Completed")).toBeInTheDocument();
    expect(screen.getByLabelText("Collect 7 x Mia Doll progress")).toHaveTextContent("7/7");
    expect(screen.queryByRole("button", { name: "Abandon quest" })).not.toBeInTheDocument();
  });
});
