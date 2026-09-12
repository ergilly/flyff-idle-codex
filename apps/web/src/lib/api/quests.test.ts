import {
  abandonCharacterQuest,
  acceptCharacterQuest,
  completeCharacterQuest,
  fetchActiveQuests,
  fetchQuestOfficeQuests
} from "@/lib/api/quests";

describe("quest API", () => {
  afterEach(() => jest.restoreAllMocks());

  it("loads, deduplicates, and sorts quests connected to an NPC", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        json: jest.fn().mockResolvedValue({
          results: [
            { id: 2, name: "Later", minLevel: 20, maxLevel: 190, repeatable: false, type: "category" },
            { id: 1, name: "Earlier", minLevel: 10, maxLevel: 190, repeatable: false, type: "category" }
          ]
        }),
        ok: true
      })
      .mockResolvedValueOnce({
        json: jest.fn().mockResolvedValue({
          results: [
            { id: 1, name: "Earlier", minLevel: 10, maxLevel: 190, repeatable: false, type: "category" }
          ]
        }),
        ok: true
      });
    global.fetch = fetchMock;

    await expect(fetchQuestOfficeQuests(29)).resolves.toEqual([
      expect.objectContaining({ id: 1 }),
      expect.objectContaining({ id: 2 })
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0]?.[0]).toContain("beginNPC=29");
    expect(fetchMock.mock.calls[1]?.[0]).toContain("endNPC=29");
  });

  it("ignores invalid NPC ids", async () => {
    const fetchMock = jest.fn();
    global.fetch = fetchMock;
    await expect(fetchQuestOfficeQuests(0)).resolves.toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("hydrates active quest objectives, contacts, instructions, and rewards", async () => {
    const responses = [
      [
        {
          id: 129,
          name: "Blessed Doll",
          type: "category",
          repeatable: false,
          minLevel: 23,
          maxLevel: 190,
          description: "Collect presents for the children.",
          dialogsAccept: ["Collect the dolls from Mia."],
          beginNPC: 29,
          endNPC: 29,
          endNeededItems: [
            { item: 7166, count: 7 },
            { item: 7166, count: 1 }
          ],
          endKillMonsters: [{ monster: [8302], count: 3 }],
          endReceiveGold: 11500,
          endReceiveExperience: [1],
          endReceiveItems: [{ item: 6778, count: 1 }]
        }
      ],
      [
        { id: 7166, name: "Mia Doll" },
        { id: 6778, name: "Gift Box" }
      ],
      [{ id: 8302, name: "Mia" }],
      [{ id: 29, name: "Mikyel" }]
    ];
    global.fetch = jest.fn().mockImplementation(() =>
      Promise.resolve({
        json: jest.fn().mockResolvedValue({ results: responses.shift() }),
        ok: true
      })
    );

    await expect(fetchActiveQuests([129, 129, -1])).resolves.toEqual([
      expect.objectContaining({
        giverName: "Mikyel",
        handInName: "Mikyel",
        instructions: ["Collect the dolls from Mia."],
        experiencePercentages: [1],
        objectives: [
          { itemId: "7166", kind: "item", label: "Collect 7 x Mia Doll", requiredCount: 7 },
          { kind: "other", label: "Defeat 3 x Mia" }
        ],
        rewards: ["11,500 Penya", "1 x Gift Box"]
      })
    ]);
    expect(global.fetch).toHaveBeenCalledTimes(4);
  });

  it("does not request quest data when the character has no active quests", async () => {
    global.fetch = jest.fn();
    await expect(fetchActiveQuests([])).resolves.toEqual([]);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("accepts a quest for the current character", async () => {
    const character = { id: "character-1", activeQuestIds: [129] };
    const fetchMock = jest.fn().mockResolvedValue({
      json: jest.fn().mockResolvedValue({ character }),
      ok: true
    });
    global.fetch = fetchMock;

    await expect(acceptCharacterQuest("token", "character-1", 129, 29)).resolves.toBe(character);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/characters/character-1/quests"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ questId: 129, npcId: 29 })
      })
    );
  });

  it("abandons an active quest for the current character", async () => {
    const character = { id: "character-1", activeQuestIds: [] };
    const fetchMock = jest.fn().mockResolvedValue({
      json: jest.fn().mockResolvedValue({ character }),
      ok: true
    });
    global.fetch = fetchMock;

    await expect(abandonCharacterQuest("token", "character-1", 129)).resolves.toBe(character);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/characters/character-1/quests/129"),
      expect.objectContaining({ method: "DELETE" })
    );
  });

  it("completes an active quest at its ending NPC", async () => {
    const character = { id: "character-1", activeQuestIds: [], completedQuestIds: [129] };
    const fetchMock = jest.fn().mockResolvedValue({
      json: jest.fn().mockResolvedValue({ character }),
      ok: true
    });
    global.fetch = fetchMock;

    await expect(completeCharacterQuest("token", "character-1", 129, 29)).resolves.toBe(character);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/characters/character-1/quests/129/complete"),
      expect.objectContaining({ method: "POST", body: JSON.stringify({ npcId: 29 }) })
    );
  });
});
