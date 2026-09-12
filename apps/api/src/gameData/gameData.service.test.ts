import path from "node:path";
import { DatabaseSync } from "node:sqlite";

import { findDataRecord, isDataSetName, listDataSets, queryDataSet } from "./gameData.service.js";

describe("game data service", () => {
  it("lists and validates known data sets", () => {
    expect(listDataSets()).toEqual(
      expect.arrayContaining([
        { name: "items", href: "/api/data/items" },
        { name: "mapMonsters", href: "/api/data/mapMonsters" },
        { name: "npcs", href: "/api/data/npcs" },
        { name: "quests", href: "/api/data/quests" },
        { name: "skills", href: "/api/data/skills" }
      ])
    );
    expect(isDataSetName("items")).toBe(true);
    expect(isDataSetName("mapMonsters")).toBe(true);
    expect(isDataSetName("npcs")).toBe(true);
    expect(isDataSetName("quests")).toBe(true);
    expect(isDataSetName("unknown")).toBe(false);
  });

  it("loads quest records from the game data database", () => {
    expect(findDataRecord("quests", "88")).toEqual(
      expect.objectContaining({
        id: 88,
        name: "Successor of Hero -Altar-",
        type: "chain"
      })
    );
    expect(queryDataSet("quests", { beginNPC: "29", fields: "id,name,minLevel" })).toMatchObject({
      dataSet: "quests",
      total: 1,
      results: [{ id: 129, name: "Blessed Doll", minLevel: 23 }]
    });
    expect(findDataRecord("quests", "129")).toMatchObject({
      description: "Bring 7 Mia Doll to Mikyel.",
      dialogsAccept: ["You can collect Mia Doll from all types of Mia."]
    });
    expect(
      queryDataSet("quests", {
        beginNPC: "29",
        fields: "id,description,dialogsAccept"
      }).results
    ).toEqual([
      {
        id: 129,
        description: "Bring 7 Mia Doll to Mikyel.",
        dialogsAccept: ["You can collect Mia Doll from all types of Mia."]
      }
    ]);
  });

  it("loads NPC records from the game data database", () => {
    expect(findDataRecord("npcs", "29")).toEqual(
      expect.objectContaining({
        id: 29,
        name: "Mikyel",
        place: "questoffice"
      })
    );
  });

  it("includes every imported NPC in the deployable game data database", () => {
    const database = new DatabaseSync(path.resolve(__dirname, "../../data/game-data.db"), {
      readOnly: true
    });

    try {
      const { count } = database
        .prepare("SELECT COUNT(*) AS count FROM game_data_records WHERE data_set = 'npcs'")
        .get() as { count: number };

      expect(count).toBe(286);
    } finally {
      database.close();
    }
  });

  it("includes every imported quest in the deployable game data database", () => {
    const database = new DatabaseSync(path.resolve(__dirname, "../../data/game-data.db"), {
      readOnly: true
    });

    try {
      const { count } = database
        .prepare("SELECT COUNT(*) AS count FROM game_data_records WHERE data_set = 'quests'")
        .get() as { count: number };

      expect(count).toBe(775);
    } finally {
      database.close();
    }
  });

  it("finds records and ignores missing ids", () => {
    expect(findDataRecord("items", "3497")).toEqual(
      expect.objectContaining({
        id: 3497,
        name: "Wooden Sword"
      })
    );
    expect(findDataRecord("items", "missing")).toBeUndefined();
    expect(queryDataSet("items", { ids: ["3497,missing"], fields: "id,name" })).toMatchObject({
      dataSet: "items",
      total: 1,
      results: [{ id: 3497, name: "Wooden Sword" }]
    });
  });

  it("finds map monsters by their inner id instead of the JSON key", () => {
    expect(findDataRecord("mapMonsters", "3801")).toEqual(
      expect.objectContaining({
        id: 3801,
        name: "Bang"
      })
    );
    expect(findDataRecord("mapMonsters", "3")).toBeUndefined();
    expect(queryDataSet("mapMonsters", { ids: "3801,3,missing", fields: "id,name" })).toMatchObject({
      dataSet: "mapMonsters",
      total: 1,
      results: [{ id: 3801, name: "Bang" }]
    });
  });

  it("applies text, scalar, boolean, range, class, pagination, and field filters", () => {
    const namedItems = queryDataSet("items", {
      q: "wooden",
      category: "weapon",
      minLevel: "1",
      maxLevel: "1",
      limit: "2",
      offset: "0",
      fields: "id,name,category,level"
    });

    expect(namedItems).toMatchObject({
      dataSet: "items",
      limit: 2,
      offset: 0,
      results: expect.arrayContaining([
        expect.objectContaining({
          name: expect.stringContaining("Wooden"),
          category: "weapon",
          level: 1
        })
      ])
    });

    const skillsByClassName = queryDataSet("skills", {
      class: "Mercenary",
      maxLevel: "20",
      fields: "id,class,name"
    });

    expect(skillsByClassName.results).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          class: 764
        })
      ])
    );

    expect(queryDataSet("items", { twoHanded: "true", ids: "10", fields: "id,twoHanded" })).toMatchObject({
      total: 1,
      results: [{ id: 10, twoHanded: true }]
    });
  });

  it("queries curated map monsters by family", () => {
    const bangFamily = queryDataSet("mapMonsters", { family: "bang", fields: "name,family,location,spawns" });

    expect(bangFamily).toMatchObject({
      dataSet: "mapMonsters",
      total: 4,
      results: expect.arrayContaining([
        expect.objectContaining({
          family: "bang",
          location: { region: "flaris", x: 58, y: 39 },
          name: "Boss Bang"
        }),
        expect.objectContaining({
          family: "bang",
          name: "Giant Bang"
        })
      ])
    });
    expect(bangFamily.results.every((monster) => !("spawns" in monster))).toBe(true);

    expect(queryDataSet("mapMonsters", { family: "bang", "location.region": "flaris" })).toMatchObject({
      dataSet: "mapMonsters",
      total: 4,
      results: expect.arrayContaining([
        expect.objectContaining({
          family: "bang",
          location: expect.objectContaining({ region: "flaris" })
        })
      ])
    });
  });

  it("stores attack timing for every mapped monster in every populated region", () => {
    const database = new DatabaseSync(path.resolve(__dirname, "../../data/game-data.db"), {
      readOnly: true
    });

    try {
      const records = database
        .prepare("SELECT payload FROM game_data_records WHERE data_set = 'mapMonsters'")
        .all()
        .map(({ payload }) => JSON.parse(String(payload)) as Record<string, unknown>);

      expect(records).toHaveLength(264);
      expect(new Set(records.map((record) => (record.location as { region: string }).region))).toEqual(
        new Set(["flaris", "saint", "rhisis", "darkon12", "darkon3"])
      );
      expect(
        records.every(
          (monster) =>
            typeof monster.attackSpeed === "number" &&
            monster.attackSpeed > 0 &&
            typeof monster.attackDelay === "number" &&
            monster.attackDelay > 0
        )
      ).toBe(true);
    } finally {
      database.close();
    }
  });

  it("falls back to default limits and omits unmatched filters", () => {
    expect(
      queryDataSet("items", { limit: "-1", offset: "bad", minLevel: "bad", maxLevel: "bad" })
    ).toMatchObject({
      limit: 100,
      offset: 0,
      total: expect.any(Number)
    });
    expect(queryDataSet("items", { ids: "", missingField: "" }).total).toBeGreaterThan(0);
    expect(queryDataSet("items", { q: "definitely-not-an-item-name" })).toMatchObject({
      total: 0,
      results: []
    });
  });
});
