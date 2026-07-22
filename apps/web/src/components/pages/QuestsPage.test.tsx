import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QuestsPage } from "./QuestsPage";
import { fetchActiveQuests } from "@/lib/api";

jest.mock("@/lib/api", () => ({
  ...jest.requireActual("@/lib/api"),
  fetchActiveQuests: jest.fn()
}));

describe("QuestsPage", () => {
  const mockedFetchActiveQuests = jest.mocked(fetchActiveQuests);

  beforeEach(() => mockedFetchActiveQuests.mockReset());

  it("loads the character's active quests", async () => {
    mockedFetchActiveQuests.mockResolvedValue([
      {
        id: 129,
        name: "Blessed Doll",
        type: "category",
        repeatable: false,
        minLevel: 23,
        maxLevel: 190,
        instructions: [],
        objectives: [{ itemId: "7166", kind: "item", label: "Collect 7 x Mia Doll", requiredCount: 7 }],
        rewards: []
      }
    ]);

    render(
      <QuestsPage
        activeQuestIds={[129]}
        characterLevel={23}
        characterProgressionRank="normal"
        inventoryItems={[{ slotIndex: 0, itemId: "7166", quantity: 4 }]}
      />
    );

    expect(screen.getByText("Loading active quests...")).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "Blessed Doll" })).toBeInTheDocument();
    expect(screen.getByLabelText("Collect 7 x Mia Doll progress")).toHaveTextContent("4/7");
    expect(mockedFetchActiveQuests).toHaveBeenCalledWith([129]);
  });

  it("shows quest loading errors", async () => {
    mockedFetchActiveQuests.mockRejectedValue(new Error("Quest log unavailable"));
    render(<QuestsPage activeQuestIds={[129]} characterLevel={23} characterProgressionRank="normal" />);
    expect(await screen.findByText("Quest log unavailable")).toBeInTheDocument();
  });

  it("loads completed quests into a collapsed completed section", async () => {
    mockedFetchActiveQuests.mockResolvedValue([
      {
        id: 129,
        name: "Blessed Doll",
        type: "category",
        repeatable: false,
        minLevel: 23,
        maxLevel: 190,
        instructions: [],
        objectives: [],
        rewards: []
      }
    ]);

    render(
      <QuestsPage
        activeQuestIds={[]}
        characterLevel={23}
        characterProgressionRank="normal"
        completedQuestIds={[129]}
      />
    );

    expect(await screen.findByText("Completed quests (1)")).toBeInTheDocument();
    expect(screen.getByText("Completed quests (1)").closest("details")).not.toHaveAttribute("open");
    expect(mockedFetchActiveQuests).toHaveBeenCalledWith([129]);
  });

  it("passes quest abandonment through to the active character action", async () => {
    mockedFetchActiveQuests.mockResolvedValue([
      {
        id: 129,
        name: "Blessed Doll",
        type: "category",
        repeatable: false,
        minLevel: 23,
        maxLevel: 190,
        instructions: [],
        objectives: [],
        rewards: []
      }
    ]);
    const onAbandonQuest = jest.fn().mockResolvedValue(undefined);
    render(
      <QuestsPage
        activeQuestIds={[129]}
        characterLevel={23}
        characterProgressionRank="normal"
        onAbandonQuest={onAbandonQuest}
      />
    );

    await screen.findByRole("heading", { name: "Blessed Doll" });
    fireEvent.click(screen.getByRole("button", { name: "Abandon quest" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm abandon" }));
    await waitFor(() => expect(onAbandonQuest).toHaveBeenCalledWith(129));
  });
});
