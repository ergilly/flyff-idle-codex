import { render, screen } from "@testing-library/react";
import { QuestObjectivesSection } from "./QuestObjectivesSection";

describe("QuestObjectivesSection", () => {
  it("caps inventory progress at the quest requirement", () => {
    render(
      <QuestObjectivesSection
        inventoryItems={[{ slotIndex: 0, itemId: "7350", quantity: 8 }]}
        objectives={[{ itemId: "7350", kind: "item", label: "Collect 3 x Chupim", requiredCount: 3 }]}
      />
    );

    expect(screen.getByLabelText("Collect 3 x Chupim progress")).toHaveTextContent("3/3");
  });

  it("shows completed requirements as met without reading current inventory", () => {
    render(
      <QuestObjectivesSection
        completed
        inventoryItems={[]}
        objectives={[
          { itemId: "7350", kind: "item", label: "Collect 3 x Chupim", requiredCount: 3 },
          { kind: "other", label: "Defeat 2 x Lawolf" }
        ]}
      />
    );

    expect(screen.getByLabelText("Collect 3 x Chupim progress")).toHaveTextContent("3/3");
    expect(screen.getByRole("progressbar", { name: "Collect 3 x Chupim completion" })).toHaveAttribute(
      "aria-valuenow",
      "3"
    );
    expect(screen.getByText("Defeat 2 x Lawolf").closest("li")).toHaveTextContent("Completed");
  });
});
