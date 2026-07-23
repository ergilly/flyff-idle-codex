import { normalizeQuestItemRequirements } from "./questItemRequirements";

describe("normalizeQuestItemRequirements", () => {
  it("keeps the largest requirement when quest data repeats an item", () => {
    expect(
      normalizeQuestItemRequirements([
        { item: 7350, count: 3 },
        { item: 7350, count: 1 },
        { item: 7735, count: 5 }
      ])
    ).toEqual([
      { item: 7350, count: 3 },
      { item: 7735, count: 5 }
    ]);
  });

  it("drops invalid requirements", () => {
    expect(normalizeQuestItemRequirements([{ item: 7350, count: 0 }])).toEqual([]);
  });
});
