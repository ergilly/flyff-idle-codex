import path from "node:path";
import { DatabaseSync } from "node:sqlite";

import type { JsonDataRecord } from "./gameData.types.js";
import {
  createQuestTextReferenceIndex,
  findQuestTextPlaceholders,
  resolveQuestText
} from "./questTextResolver.js";

describe("quest text resolver", () => {
  it("resolves indexed objectives and reference names throughout a quest", () => {
    const references = createQuestTextReferenceIndex({
      items: {
        "10": { id: 10, name: "Mia Doll", description: "Quest item that drops from Mia." },
        "11": { id: 11, name: "Golden Wing", description: "Quest item that drops from Bang." }
      },
      monsters: {
        "20": { id: 20, name: "Small Aibatt", rank: "small" },
        "21": { id: 21, name: "Aibatt", rank: "normal" },
        "22": { id: 22, name: "Giant Bang", rank: "giant" }
      },
      npcs: {
        "29": { id: 29, name: "Mikyel" }
      }
    });
    const quest = {
      id: 1,
      endNPC: 29,
      endNeededItems: [
        { item: 10, count: 7 },
        { item: 11, count: 3 }
      ],
      endKillMonsters: [
        { monster: [20, 21], count: 5 },
        { monster: [22], count: 1 }
      ],
      description:
        "Bring $QUEST_END_ITEM_COUNT$x $QUEST_END_ITEM_NAME$ and $QUEST_END_ITEM_COUNT,2$x $QUEST_END_ITEM_NAME,2$ to $QUEST_END_NPC_NAME$.",
      dialogsAccept: [
        "Collect $QUEST_END_ITEM_NAME$ from $QUEST_END_ITEM_MON$ and defeat $QUEST_END_KILL_COUNT$ $QUEST_END_KILL_NAME$ plus $QUEST_END_KILL_NAME,2$."
      ],
      dialogsFail: ["Leave $FUTURE_QUEST_TOKEN$ unchanged."]
    } satisfies JsonDataRecord;

    expect(resolveQuestText(quest, references)).toMatchObject({
      description: "Bring 7x Mia Doll and 3x Golden Wing to Mikyel.",
      dialogsAccept: ["Collect Mia Doll from Mia and defeat 5 Aibatt plus Giant Bang."],
      dialogsFail: ["Leave $FUTURE_QUEST_TOKEN$ unchanged."]
    });
  });

  it("leaves a known placeholder intact when its reference is unavailable", () => {
    const references = createQuestTextReferenceIndex({ items: {}, monsters: {}, npcs: {} });
    const quest = {
      id: 1,
      description: "Return to $QUEST_END_NPC_NAME$."
    } satisfies JsonDataRecord;

    expect(resolveQuestText(quest, references).description).toBe("Return to $QUEST_END_NPC_NAME$.");
  });

  it("resolves every placeholder in the deployable quest data", () => {
    const database = new DatabaseSync(path.resolve(__dirname, "../../data/game-data.db"), {
      readOnly: true
    });

    try {
      const quests = readDataSet(database, "quests");
      const references = createQuestTextReferenceIndex({
        items: readDataSet(database, "items"),
        monsters: readDataSet(database, "monsters"),
        npcs: readDataSet(database, "npcs")
      });
      const rawPlaceholders = Object.values(quests).flatMap(findQuestTextPlaceholders);
      const unresolvedPlaceholders = Object.values(quests)
        .map((quest) => resolveQuestText(quest, references))
        .flatMap(findQuestTextPlaceholders);

      expect(rawPlaceholders).toHaveLength(870);
      expect(unresolvedPlaceholders).toEqual([]);
    } finally {
      database.close();
    }
  });
});

function readDataSet(database: DatabaseSync, dataSet: string) {
  const rows = database
    .prepare("SELECT record_key AS recordKey, payload FROM game_data_records WHERE data_set = ?")
    .all(dataSet) as Array<{ payload: string; recordKey: string }>;

  return Object.fromEntries(
    rows.map(({ payload, recordKey }) => [recordKey, JSON.parse(payload) as JsonDataRecord])
  );
}
