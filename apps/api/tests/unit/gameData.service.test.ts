import {
  findDataRecord,
  isDataSetName,
  listDataSets,
  queryDataSet
} from "../../src/gameData/gameData.service.js";

describe("game data service", () => {
  it("lists and validates known data sets", () => {
    expect(listDataSets()).toEqual(
      expect.arrayContaining([
        { name: "items", href: "/api/data/items" },
        { name: "mapMonsters", href: "/api/data/mapMonsters" },
        { name: "skills", href: "/api/data/skills" }
      ])
    );
    expect(isDataSetName("items")).toBe(true);
    expect(isDataSetName("mapMonsters")).toBe(true);
    expect(isDataSetName("unknown")).toBe(false);
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
