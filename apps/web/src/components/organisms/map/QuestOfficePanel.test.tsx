import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QuestOfficePanel } from "@/components/organisms/map/QuestOfficePanel";
import { fetchQuestOfficeQuests } from "@/lib/api";

jest.mock("@/lib/api", () => ({
  ...jest.requireActual("@/lib/api"),
  fetchQuestOfficeQuests: jest.fn()
}));

describe("QuestOfficePanel", () => {
  const mockedFetchQuestOfficeQuests = jest.mocked(fetchQuestOfficeQuests);

  beforeEach(() => mockedFetchQuestOfficeQuests.mockReset());

  it("steps through dialogue, declines without removing, and accepts a quest", async () => {
    mockedFetchQuestOfficeQuests.mockResolvedValue([
      {
        id: 129,
        name: "Blessed Doll",
        type: "category",
        repeatable: false,
        minLevel: 23,
        maxLevel: 190,
        description: "Collect Mia Dolls.",
        descriptionComplete: "Mikyel thanks you.",
        dialogsBegin: ["The children need presents.", "Can you collect seven dolls?"],
        endReceiveExperience: [...Array.from({ length: 22 }, () => 0), 35],
        endReceiveGold: 11500
      }
    ]);
    const onAcceptQuest = jest.fn().mockResolvedValue(undefined);

    render(
      <QuestOfficePanel characterLevel={23} npcId={29} npcName="Mikyel" onAcceptQuest={onAcceptQuest} />
    );

    expect(await screen.findByText("1 available quest")).toBeInTheDocument();
    const questButton = screen.getByRole("button", { name: /Blessed Doll/ });
    fireEvent.click(questButton);
    expect(screen.getByText("The children need presents.")).toBeInTheDocument();
    expect(screen.getByText("Reward: 11,500 Penya")).toBeInTheDocument();
    expect(screen.getByText("Reward: 35% EXP at level 23")).toBeInTheDocument();
    expect(screen.queryByText("Mikyel thanks you.")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Accept" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByText("Can you collect seven dolls?")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Decline" }));
    expect(screen.queryByText("The children need presents.")).not.toBeInTheDocument();
    expect(screen.getByText("Blessed Doll")).toBeInTheDocument();

    fireEvent.click(questButton);
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    fireEvent.click(screen.getByRole("button", { name: "Accept" }));

    await waitFor(() => expect(onAcceptQuest).toHaveBeenCalledWith(29, 129));
    expect(await screen.findByText("This quest is in the character's current quests.")).toBeInTheDocument();
    expect(screen.getByText("Accepted")).toBeInTheDocument();
  });

  it("disables acceptance when the character does not meet the level requirement", async () => {
    mockedFetchQuestOfficeQuests.mockResolvedValue([
      {
        id: 129,
        name: "Blessed Doll",
        type: "category",
        repeatable: false,
        minLevel: 23,
        maxLevel: 190
      }
    ]);
    render(<QuestOfficePanel characterLevel={20} npcId={29} npcName="Mikyel" />);
    fireEvent.click(await screen.findByRole("button", { name: /Blessed Doll/ }));
    expect(screen.getByRole("button", { name: "Accept" })).toBeDisabled();
  });

  it("shows completion dialogue only while handing in a ready item quest", async () => {
    mockedFetchQuestOfficeQuests.mockResolvedValue([
      {
        id: 129,
        name: "Blessed Doll",
        type: "category",
        repeatable: false,
        minLevel: 23,
        maxLevel: 190,
        beginNPC: 29,
        endNPC: 29,
        endNeededItems: [{ item: 7166, count: 7 }],
        description: "Collect Mia Dolls.",
        descriptionComplete: "Mikyel checks the dolls.",
        dialogsBegin: ["Please collect the dolls."],
        dialogsComplete: ["The children will be delighted.", "Please take your reward."]
      }
    ]);
    const onCompleteQuest = jest.fn().mockResolvedValue(undefined);
    render(
      <QuestOfficePanel
        activeQuestIds={[129]}
        characterInventory={{
          size: 50,
          items: [{ slotIndex: 0, itemId: "7166", quantity: 13 }]
        }}
        characterLevel={23}
        npcId={29}
        npcName="Mikyel"
        onCompleteQuest={onCompleteQuest}
      />
    );

    fireEvent.click(await screen.findByRole("button", { name: /Blessed Doll/ }));
    expect(screen.getByText("Ready")).toBeInTheDocument();
    expect(screen.queryByText("Mikyel checks the dolls.")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Hand in quest" }));
    expect(screen.getByText("Mikyel checks the dolls.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByText("The children will be delighted.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByText("Please take your reward.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Complete quest" }));

    await waitFor(() => expect(onCompleteQuest).toHaveBeenCalledWith(29, 129));
    expect(await screen.findByText("Completed")).toBeInTheDocument();
    expect(screen.getByText("This quest has been completed.")).toBeInTheDocument();
    expect(screen.getByText("Completed quests (1)").closest("details")).not.toHaveAttribute("open");
  });

  it("places previously completed quests in the collapsed completed section", async () => {
    mockedFetchQuestOfficeQuests.mockResolvedValue([
      {
        id: 129,
        name: "Blessed Doll",
        type: "category",
        repeatable: false,
        minLevel: 23,
        maxLevel: 190
      }
    ]);

    render(<QuestOfficePanel characterLevel={23} completedQuestIds={[129]} npcId={29} npcName="Mikyel" />);

    expect(await screen.findByText("0 available quests")).toBeInTheDocument();
    expect(screen.getByText("Completed quests (1)").closest("details")).not.toHaveAttribute("open");
  });

  it("shows quest loading failures", async () => {
    mockedFetchQuestOfficeQuests.mockRejectedValue(new Error("Quest data unavailable"));
    render(<QuestOfficePanel npcId={4000} npcName="Lancomi" />);
    expect(await screen.findByText("Quest data unavailable")).toBeInTheDocument();
  });
});
