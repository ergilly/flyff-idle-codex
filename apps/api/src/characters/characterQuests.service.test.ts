import { getQuestAbandonmentError, getQuestAcceptanceError } from "./characterQuests.service.js";

describe("character quest acceptance", () => {
  const character = { job: "Vagrant", level: 23 };
  const quest = { id: 129, beginNPC: 29, minLevel: 23, maxLevel: 190 };

  it("allows an eligible quest offered by the selected NPC", () => {
    expect(getQuestAcceptanceError(character, quest, [], 29)).toBeNull();
  });

  it("rejects the wrong NPC, level, and an already active quest", () => {
    expect(getQuestAcceptanceError(character, quest, [], 4000)).toMatchObject({ status: "ineligible" });
    expect(getQuestAcceptanceError({ ...character, level: 22 }, quest, [], 29)).toMatchObject({
      status: "ineligible"
    });
    expect(getQuestAcceptanceError(character, quest, [{ questId: 129, status: "active" }], 29)).toMatchObject(
      { status: "conflict" }
    );
  });

  it("requires completed prerequisite quests", () => {
    const chainedQuest = { ...quest, beginQuests: [{ quest: 88, completed: true }] };
    expect(getQuestAcceptanceError(character, chainedQuest, [], 29)).toMatchObject({
      status: "ineligible"
    });
    expect(
      getQuestAcceptanceError(character, chainedQuest, [{ questId: 88, status: "completed" }], 29)
    ).toBeNull();
  });

  it("only allows active quests to be abandoned", () => {
    expect(getQuestAbandonmentError([{ questId: 129, status: "active" }], 129)).toBeNull();
    expect(getQuestAbandonmentError([{ questId: 129, status: "completed" }], 129)).toBe(
      "Active quest not found"
    );
    expect(getQuestAbandonmentError([], 129)).toBe("Active quest not found");
  });
});
