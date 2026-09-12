import { getQuestItemProgress } from "./questProgress";

describe("getQuestItemProgress", () => {
  it("sums matching inventory stacks and caps progress at the required amount", () => {
    expect(
      getQuestItemProgress(
        [
          { slotIndex: 0, itemId: "7166", quantity: 8 },
          { slotIndex: 1, itemId: "7166", quantity: 5 },
          { slotIndex: 2, itemId: "other", quantity: 99 }
        ],
        "7166",
        10
      )
    ).toEqual({ current: 10, isComplete: true, required: 10 });
  });

  it("reports partial progress without counting invalid quantities", () => {
    expect(
      getQuestItemProgress(
        [
          { slotIndex: 0, itemId: "7166", quantity: 4 },
          { slotIndex: 1, itemId: "7166", quantity: -2 }
        ],
        "7166",
        10
      )
    ).toEqual({ current: 4, isComplete: false, required: 10 });
  });
});
