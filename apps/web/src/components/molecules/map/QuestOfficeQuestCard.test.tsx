import { fireEvent, render, screen } from "@testing-library/react";
import {
  QuestOfficeQuestCard,
  type QuestOfficeQuestCardProps
} from "@/components/molecules/map/QuestOfficeQuestCard";

const baseProps: QuestOfficeQuestCardProps = {
  accepted: true,
  actionError: "",
  canHandIn: true,
  characterLevel: 23,
  completed: false,
  dialogueIndex: 0,
  expanded: true,
  handingIn: false,
  onAccept: jest.fn(),
  onComplete: jest.fn(),
  onDecline: jest.fn(),
  onHandIn: jest.fn(),
  onNextDialogue: jest.fn(),
  onToggle: jest.fn(),
  pending: false,
  quest: {
    id: 129,
    name: "Blessed Doll",
    type: "category",
    repeatable: false,
    minLevel: 23,
    maxLevel: 190,
    description: "Collect Mia Dolls.",
    descriptionComplete: "Mikyel checks the dolls.",
    dialogsBegin: ["Please collect the dolls."],
    dialogsComplete: ["The children will be delighted."]
  }
};

describe("QuestOfficeQuestCard", () => {
  it("keeps completion dialogue hidden until the hand-in interaction begins", () => {
    const { rerender } = render(<QuestOfficeQuestCard {...baseProps} />);

    expect(screen.getByText("Please collect the dolls.")).toBeInTheDocument();
    expect(screen.queryByText("Mikyel checks the dolls.")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Hand in quest" }));
    expect(baseProps.onHandIn).toHaveBeenCalledTimes(1);

    rerender(<QuestOfficeQuestCard {...baseProps} handingIn />);
    expect(screen.getByText("Mikyel checks the dolls.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next" })).toBeInTheDocument();
  });
});
