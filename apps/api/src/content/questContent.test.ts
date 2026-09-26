import { applyQuestContent, getQuestContent } from "./questContent.js";

describe("authored quest content", () => {
  it("keeps canonical quests unchanged when no local override exists", () => {
    const quest = { id: 123, name: "Canonical quest" };

    expect(getQuestContent(quest.id)).toBeUndefined();
    expect(applyQuestContent(quest)).toEqual(quest);
  });
});
