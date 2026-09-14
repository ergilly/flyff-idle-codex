import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { loadShopCatalog } from "./contentLoader.js";

function createContentDirectory(document: unknown) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "flyff-idle-content-"));
  fs.writeFileSync(path.join(directory, "shops.json"), JSON.stringify(document));
  return directory;
}

function minimalShop(overrides: Record<string, unknown> = {}) {
  return {
    id: "flarine-town/general-store",
    merchantNames: ["Lui"],
    merchants: [
      {
        id: "850",
        name: "Lui",
        tabs: [
          {
            id: "posters",
            label: "Posters",
            items: [{ id: "3907" }]
          }
        ]
      }
    ],
    ...overrides
  };
}

describe("local content loader", () => {
  it("loads the checked-in shop catalog", () => {
    const catalog = loadShopCatalog();

    expect(Object.keys(catalog)).toHaveLength(19);
    expect(catalog["flarine-town/general-store"]?.merchants[0]?.tabs[0]?.items[0]).toEqual({ id: "3907" });
  });

  it("loads and indexes validated shop JSON by shop id", () => {
    const directory = createContentDirectory({ version: 1, shops: [minimalShop()] });

    expect(loadShopCatalog(directory)).toEqual({
      "flarine-town/general-store": minimalShop()
    });
  });

  it("rejects duplicate shop ids", () => {
    const shop = minimalShop();
    const directory = createContentDirectory({ version: 1, shops: [shop, shop] });

    expect(() => loadShopCatalog(directory)).toThrow('duplicate shop id "flarine-town/general-store"');
  });

  it("rejects stock that does not exist in canonical item data", () => {
    const directory = createContentDirectory({ version: 1, shops: [minimalShop()] });

    expect(() => loadShopCatalog(directory, { knownItemIds: new Set(["other-item"]) })).toThrow(
      'item id "3907" is not present in game data'
    );
  });

  it("rejects malformed content with a useful path", () => {
    const directory = createContentDirectory({ version: 1, shops: [{ id: "invalid" }] });

    expect(() => loadShopCatalog(directory)).toThrow(/Invalid local shop content/);
    expect(() => loadShopCatalog(directory)).toThrow(/merchantNames/);
  });
});
