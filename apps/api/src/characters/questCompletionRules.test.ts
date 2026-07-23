import { getQuestCompletionCheck } from "./questCompletionRules.js";

const character = {
  inventory: { size: 50, items: [{ slotIndex: 0, itemId: "7166", quantity: 7 }] }
};
const quest = {
  id: 129,
  endNPC: 29,
  endNeededItems: [{ item: 7166, count: 7 }],
  endRemoveItems: [{ item: 7166, count: 7 }],
  endReceiveGold: 11500,
  endReceiveExperience: [35]
};

describe("quest completion rules", () => {
  it("builds a reward and item-removal plan for a completed collection quest", () => {
    expect(getQuestCompletionCheck(character, quest, 29)).toEqual({
      status: "ready",
      plan: {
        experiencePercentages: [35],
        penya: 11500,
        requiredItems: [{ itemId: "7166", quantity: 7 }],
        removeItems: [{ itemId: "7166", quantity: 7 }]
      }
    });
  });

  it("keeps the largest count when quest data repeats an item requirement", () => {
    const duplicateQuest = {
      ...quest,
      endNeededItems: [
        { item: 7350, count: 3 },
        { item: 7350, count: 1 }
      ],
      endRemoveItems: [
        { item: 7350, count: 3 },
        { item: 7350, count: 1 }
      ]
    };

    expect(
      getQuestCompletionCheck(
        { inventory: { size: 50, items: [{ slotIndex: 0, itemId: "7350", quantity: 3 }] } },
        duplicateQuest,
        29
      )
    ).toMatchObject({
      status: "ready",
      plan: {
        requiredItems: [{ itemId: "7350", quantity: 3 }],
        removeItems: [{ itemId: "7350", quantity: 3 }]
      }
    });
  });

  it("rejects the wrong NPC and missing required items", () => {
    expect(getQuestCompletionCheck(character, quest, 4000)).toMatchObject({ status: "incomplete" });
    expect(
      getQuestCompletionCheck(
        { inventory: { size: 50, items: [{ slotIndex: 0, itemId: "7166", quantity: 6 }] } },
        quest,
        29
      )
    ).toMatchObject({ status: "incomplete", error: "Required quest items have not been collected" });
  });

  it("rejects objective and reward types that are not persisted yet", () => {
    expect(
      getQuestCompletionCheck(character, { ...quest, endKillMonsters: [{ count: 1 }] }, 29)
    ).toMatchObject({ status: "unsupported" });
    expect(
      getQuestCompletionCheck(character, { ...quest, endReceiveItems: [{ item: 1 }] }, 29)
    ).toMatchObject({ status: "unsupported" });
  });
});
