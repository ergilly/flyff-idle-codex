import {
  createCharacter,
  deleteCharacter,
  addCharacterInventoryItem,
  addCharacterPenya,
  equipInventoryItem,
  fetchCharacters,
  fetchDataSet,
  fetchItems,
  fetchMapMonsterFamilyIndex,
  fetchMapMonsterFamiliesByRegion,
  fetchMonsterFamiliesByNames,
  fetchMonstersByNames,
  fetchTownShop,
  getItemIconUrl,
  getMonsterIconUrl,
  login,
  lootInventoryItems,
  moveInventoryItem,
  purchaseFlarineGeneralStoreItem,
  purchaseTownShopItem,
  sellCharacterInventoryItem,
  register,
  refundCharacterSkills,
  refundCharacterStats,
  sortInventory,
  unequipItem,
  updateCharacterProgression
} from "../api";

function mockFetch(response: Partial<Response>) {
  global.fetch = jest.fn().mockResolvedValue({
    json: jest.fn().mockResolvedValue({}),
    ...response
  }) as jest.Mock;
}

describe("api client", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("logs in and sends credentials to the API", async () => {
    mockFetch({
      ok: true,
      json: jest.fn().mockResolvedValue({ token: "token", user: { id: "user-1" } })
    });

    await expect(login("pilot@example.com", "password123")).resolves.toEqual({
      token: "token",
      user: { id: "user-1" }
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:4000/api/auth/login",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ email: "pilot@example.com", password: "password123" })
      })
    );
  });

  it("maps auth and character API failures to user-facing errors", async () => {
    mockFetch({
      ok: false,
      status: 401,
      json: jest.fn().mockResolvedValue({ error: "That password does not match this player account." })
    });
    await expect(login("pilot@example.com", "bad-password")).rejects.toThrow(
      "That password does not match this player account."
    );

    mockFetch({
      ok: false,
      status: 404,
      json: jest.fn().mockResolvedValue({ error: "No player account exists for that email." })
    });
    await expect(login("missing@example.com", "password123")).rejects.toThrow(
      "No player account exists for that email."
    );

    mockFetch({ ok: false, status: 409 });
    await expect(register("Pilot", "pilot@example.com", "password123")).rejects.toThrow(
      "Email already registered"
    );

    mockFetch({ ok: false, status: 500 });
    await expect(register("Pilot", "pilot@example.com", "password123")).rejects.toThrow(
      "Unable to create profile"
    );

    mockFetch({ ok: false, status: 500 });
    await expect(fetchCharacters("token")).rejects.toThrow("Unable to load characters");

    mockFetch({ ok: false, status: 409 });
    await expect(createCharacter("token", 0, "Hero", "male")).rejects.toThrow(
      "That character slot is already occupied"
    );

    mockFetch({ ok: false, status: 500 });
    await expect(createCharacter("token", 0, "Hero", "female")).rejects.toThrow("Unable to create character");

    mockFetch({ ok: false, status: 400 });
    await expect(deleteCharacter("token", "char-1", "Hero")).rejects.toThrow(
      "Character name confirmation does not match"
    );

    mockFetch({ ok: false, status: 500 });
    await expect(deleteCharacter("token", "char-1", "Hero")).rejects.toThrow("Unable to delete character");
  });

  it("loads and creates characters with bearer tokens", async () => {
    const character = {
      id: "char-1",
      slotIndex: 0,
      name: "Hero",
      gender: "male",
      job: "Vagrant",
      progressionRank: "normal",
      level: 1,
      exp: 0,
      penya: 0,
      stats: { str: 15, sta: 15, dex: 15, int: 15 },
      skillLevels: {},
      equipment: {},
      inventory: { size: 50, items: [] }
    };

    mockFetch({
      ok: true,
      json: jest.fn().mockResolvedValue({ characters: [character] })
    });

    await expect(fetchCharacters("token")).resolves.toEqual([character]);
    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:4000/api/characters",
      expect.objectContaining({
        headers: {
          Authorization: "Bearer token"
        }
      })
    );

    mockFetch({
      ok: true,
      json: jest.fn().mockResolvedValue({ character })
    });

    await expect(createCharacter("token", 2, "Hero", "female")).resolves.toEqual(character);
    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:4000/api/characters",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ slotIndex: 2, name: "Hero", gender: "female" })
      })
    );

    mockFetch({ ok: true });

    await expect(deleteCharacter("token", "char-1", "Hero")).resolves.toBeUndefined();
    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:4000/api/characters/char-1",
      expect.objectContaining({
        method: "DELETE",
        body: JSON.stringify({ name: "Hero" })
      })
    );

    mockFetch({
      ok: true,
      json: jest.fn().mockResolvedValue({
        character: { ...character, stats: { str: 16, sta: 15, dex: 15, int: 15 } }
      })
    });

    await expect(
      updateCharacterProgression("token", "char-1", {
        penya: 25,
        stats: { str: 16, sta: 15, dex: 15, int: 15 },
        skillLevels: { "vagrant-clean-hit": 1 }
      })
    ).resolves.toEqual({ ...character, stats: { str: 16, sta: 15, dex: 15, int: 15 } });
    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:4000/api/characters/char-1/progression",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({
          penya: 25,
          stats: { str: 16, sta: 15, dex: 15, int: 15 },
          skillLevels: { "vagrant-clean-hit": 1 }
        })
      })
    );

    mockFetch({
      ok: true,
      json: jest.fn().mockResolvedValue({ character: { ...character, penya: 950 } })
    });

    await expect(purchaseFlarineGeneralStoreItem("token", "char-1", "5869", 3)).resolves.toEqual({
      ...character,
      penya: 950
    });
    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:4000/api/characters/char-1/shops/flarine-general-store/purchases",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ itemId: "5869", quantity: 3 })
      })
    );

    mockFetch({
      ok: true,
      json: jest.fn().mockResolvedValue({
        shop: { id: "darken-city/food-vendor", merchantNames: ["Bolpor"], merchants: [] }
      })
    });
    await expect(fetchTownShop("darken-city", "food-vendor")).resolves.toMatchObject({
      id: "darken-city/food-vendor"
    });
    expect(global.fetch).toHaveBeenCalledWith("http://localhost:4000/api/shops/darken-city/food-vendor");

    mockFetch({
      ok: true,
      json: jest.fn().mockResolvedValue({ character: { ...character, penya: 920 } })
    });
    await expect(
      purchaseTownShopItem("token", "char-1", "darken-city", "food-vendor", "5325", 2)
    ).resolves.toMatchObject({ penya: 920 });
    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:4000/api/characters/char-1/shops/darken-city/food-vendor/purchases",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ itemId: "5325", quantity: 2 })
      })
    );

    mockFetch({ ok: true, json: jest.fn().mockResolvedValue({ character: { ...character, penya: 25 } }) });
    await expect(sellCharacterInventoryItem("token", "char-1", 0, 2)).resolves.toMatchObject({
      penya: 25
    });
    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:4000/api/characters/char-1/shops/sales",
      expect.objectContaining({ method: "POST", body: JSON.stringify({ slotIndex: 0, quantity: 2 }) })
    );

    mockFetch({
      ok: true,
      json: jest.fn().mockResolvedValue({
        character: {
          ...character,
          inventory: { size: 50, items: [{ slotIndex: 0, itemId: "9001", quantity: 2 }] }
        }
      })
    });

    await expect(lootInventoryItems("token", "char-1", [{ itemId: "9001", quantity: 2 }])).resolves.toEqual({
      ...character,
      inventory: { size: 50, items: [{ slotIndex: 0, itemId: "9001", quantity: 2 }] }
    });
    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:4000/api/characters/char-1/inventory/loot",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ items: [{ itemId: "9001", quantity: 2 }] })
      })
    );
  });

  it("loads item icon metadata for unique equipped ids", async () => {
    mockFetch({
      ok: true,
      json: jest.fn().mockResolvedValue({
        items: [{ id: "3497", name: "Wooden Sword", icon: "weaswowooden.png" }]
      })
    });

    await expect(fetchItems("token", ["3497", "3497", "3314"])).resolves.toEqual([
      { id: "3497", name: "Wooden Sword", icon: "weaswowooden.png" }
    ]);
    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:4000/api/items?ids=3497,3314",
      expect.objectContaining({
        headers: {
          Authorization: "Bearer token"
        }
      })
    );
  });

  it("ignores invalid item ids before loading item metadata", async () => {
    mockFetch({
      ok: true,
      json: jest.fn().mockResolvedValue({
        items: [{ id: "3497", name: "Wooden Sword", icon: "weaswowooden.png" }]
      })
    });

    await expect(fetchItems("token", ["3497", "missing", "", " 3314 "])).resolves.toEqual([
      { id: "3497", name: "Wooden Sword", icon: "weaswowooden.png" }
    ]);
    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:4000/api/items?ids=3497,3314",
      expect.any(Object)
    );
  });

  it("loads filtered JSON data sets from the API", async () => {
    mockFetch({
      ok: true,
      json: jest.fn().mockResolvedValue({
        dataSet: "skills",
        total: 1,
        limit: 50,
        offset: 0,
        results: [{ id: 115, name: "Clean Hit", class: 9686 }]
      })
    });

    await expect(fetchDataSet("skills", { classId: 9686, limit: 50 })).resolves.toEqual([
      { id: 115, name: "Clean Hit", class: 9686 }
    ]);
    expect(global.fetch).toHaveBeenCalledWith("http://localhost:4000/api/data/skills?classId=9686&limit=50");
  });

  it("loads monster metadata keyed by assigned marker names", async () => {
    mockFetch({
      ok: true,
      json: jest.fn().mockResolvedValue({
        dataSet: "monsters",
        total: 1,
        limit: 1,
        offset: 0,
        results: [{ id: 1, name: "Aibatt", level: 1, rank: "normal", element: "wind" }]
      })
    });

    await expect(fetchMonstersByNames(["Aibatt", "Aibatt", ""])).resolves.toEqual({
      Aibatt: { id: 1, name: "Aibatt", level: 1, rank: "normal", element: "wind" }
    });
    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:4000/api/data/monsters?name=Aibatt&fields=id%2Cname%2Cexperience%2Clevel%2Crank%2Carea%2Celement%2Chp%2CminAttack%2CmaxAttack%2CattackSpeed%2CattackDelay%2Cdefense%2CmagicDefense%2Csta%2Cstr%2Cdex%2Cint%2ChitRate%2Cparry%2CnoLevelReduction%2CminDropGold%2CmaxDropGold&limit=1"
    );
  });

  it("builds monster families and quest drops from assigned marker names", async () => {
    global.fetch = jest.fn().mockImplementation((url: string) => {
      const requestUrl = new URL(url);
      const monsterName = requestUrl.searchParams.get("name") ?? "Aibatt";
      const monsterByName: Record<string, { level: number; rank: string; element: string }> = {
        "Small Aibatt": { level: 1, rank: "small", element: "wind" },
        Aibatt: { level: 1, rank: "normal", element: "wind" },
        "Captain Aibatt": { level: 2, rank: "captain", element: "wind" },
        "Giant Aibatt": { level: 5, rank: "giant", element: "fire" }
      };

      if (requestUrl.pathname.endsWith("/api/data/items")) {
        return Promise.resolve({
          ok: true,
          json: jest.fn().mockResolvedValue({
            dataSet: "items",
            total: 1,
            limit: 500,
            offset: 0,
            results: [{ id: 100, name: "Twinkle Stone", icon: "twinkle.png", category: "quest" }]
          })
        });
      }

      if (requestUrl.searchParams.has("minLevel")) {
        return Promise.resolve({
          ok: true,
          json: jest.fn().mockResolvedValue({
            dataSet: "monsters",
            total: 4,
            limit: 500,
            offset: 0,
            results: [
              {
                id: 1,
                name: "Small Aibatt",
                event: false,
                level: 1,
                rank: "small",
                element: "wind",
                drops: [{ item: 100 }]
              },
              {
                id: 2,
                name: "Aibatt",
                event: false,
                level: 1,
                rank: "normal",
                element: "wind",
                drops: [{ item: 100 }]
              },
              {
                id: 3,
                name: "Captain Aibatt",
                event: false,
                level: 2,
                rank: "captain",
                element: "wind",
                drops: [{ item: 100 }]
              },
              {
                id: 4,
                name: "Giant Aibatt",
                event: false,
                level: 5,
                rank: "giant",
                element: "fire",
                drops: [{ item: 100 }]
              }
            ]
          })
        });
      }

      return Promise.resolve({
        ok: true,
        json: jest.fn().mockResolvedValue({
          dataSet: "monsters",
          total: 1,
          limit: 5,
          offset: 0,
          results: [
            {
              id: monsterName,
              name: monsterName,
              event: false,
              level: monsterByName[monsterName]?.level ?? 1,
              rank: monsterByName[monsterName]?.rank ?? "normal",
              element: monsterByName[monsterName]?.element ?? "wind",
              drops: [{ item: 100 }]
            }
          ]
        })
      });
    }) as jest.Mock;

    await expect(
      fetchMonsterFamiliesByNames([
        {
          familyNames: {
            small: "Small Aibatt",
            normal: "Aibatt",
            captain: "Captain Aibatt",
            giant: "Giant Aibatt"
          },
          monsterName: "Aibatt"
        }
      ])
    ).resolves.toMatchObject({
      Aibatt: {
        questDrops: [{ id: 100, name: "Twinkle Stone", icon: "twinkle.png" }],
        variants: [
          { name: "Small Aibatt", level: 1, variantRank: "small" },
          { name: "Aibatt", level: 1, variantRank: "normal" },
          { name: "Captain Aibatt", level: 2, variantRank: "captain" },
          { name: "Giant Aibatt", level: 5, variantRank: "giant" }
        ]
      }
    });
  });

  it("uses explicit monster family names when marker data provides them", async () => {
    global.fetch = jest.fn().mockImplementation((url: string) => {
      const requestUrl = new URL(url);
      const name = requestUrl.searchParams.get("name") ?? "";
      const rankByName: Record<string, string> = {
        "Private Bearnerky": "small",
        "Sergeant Bearnerky": "normal",
        "Captain Bearnerky": "captain",
        "General Bearnerky": "giant"
      };

      if (requestUrl.pathname.endsWith("/api/data/items")) {
        return Promise.resolve({
          ok: true,
          json: jest.fn().mockResolvedValue({
            dataSet: "items",
            total: 1,
            limit: 500,
            offset: 0,
            results: [{ id: 200, name: "Nerkymane", icon: "nerkymane.png", category: "quest" }]
          })
        });
      }

      return Promise.resolve({
        ok: true,
        json: jest.fn().mockResolvedValue({
          dataSet: "monsters",
          total: 1,
          limit: 5,
          offset: 0,
          results: [
            {
              id: name,
              name,
              event: false,
              level: 108,
              rank: rankByName[name],
              element: "earth",
              drops: [{ item: 200 }]
            }
          ]
        })
      });
    }) as jest.Mock;

    await expect(
      fetchMonsterFamiliesByNames([
        {
          familyNames: {
            small: "Private Bearnerky",
            normal: "Sergeant Bearnerky",
            captain: "Captain Bearnerky",
            giant: "General Bearnerky"
          },
          monsterName: "Private Bearnerky"
        }
      ])
    ).resolves.toMatchObject({
      "Private Bearnerky": {
        questDrops: [{ id: 200, name: "Nerkymane", icon: "nerkymane.png" }],
        variants: [
          { name: "Private Bearnerky", variantRank: "small" },
          { name: "Sergeant Bearnerky", variantRank: "normal" },
          { name: "Captain Bearnerky", variantRank: "captain" },
          { name: "General Bearnerky", variantRank: "giant" }
        ]
      }
    });
  });

  it("builds map monster families from curated map monster data", async () => {
    global.fetch = jest.fn().mockImplementation((url: string) => {
      const requestUrl = new URL(url);

      if (requestUrl.pathname.endsWith("/api/data/items")) {
        return Promise.resolve({
          ok: true,
          json: jest.fn().mockResolvedValue({
            dataSet: "items",
            total: 1,
            limit: 500,
            offset: 0,
            results: [{ id: 100, name: "Twinkle Stone", icon: "twinkle.png", category: "quest" }]
          })
        });
      }

      const mapMonsterResults = [
        {
          id: 1,
          name: "Aibatt",
          level: 1,
          rank: "normal",
          area: "normal",
          element: "wind",
          icon: "aibatt.png",
          drops: [{ item: 100 }],
          family: "aibatt",
          location: { region: "flaris", x: 35, y: 70 }
        },
        {
          id: 2,
          name: "Small Aibatt",
          level: 1,
          rank: "small",
          area: "normal",
          element: "wind",
          icon: "small-aibatt.png",
          drops: [{ item: 100 }],
          family: "aibatt",
          location: { region: "flaris", x: 35, y: 70 }
        },
        {
          id: 3,
          name: "Captain Aibatt",
          level: 2,
          rank: "captain",
          area: "normal",
          element: "wind",
          icon: "captain-aibatt.png",
          drops: [{ item: 100 }],
          family: "aibatt",
          location: { region: "flaris", x: 35, y: 70 }
        },
        {
          id: 4,
          name: "Giant Aibatt",
          level: 5,
          rank: "giant",
          area: "normal",
          element: "fire",
          icon: "giant-aibatt.png",
          drops: [{ item: 100 }],
          family: "aibatt",
          location: { region: "flaris", x: 35, y: 70 }
        },
        {
          id: 5,
          name: "Bang",
          level: 19,
          rank: "small",
          area: "normal",
          element: "fire",
          icon: "bang.png",
          drops: [{ item: 100 }],
          family: "bang",
          location: { region: "saint", x: 42, y: 38 }
        }
      ];
      const requestedRegion = requestUrl.searchParams.get("location.region");

      return Promise.resolve({
        ok: true,
        json: jest.fn().mockResolvedValue({
          dataSet: "mapMonsters",
          total: 5,
          limit: 500,
          offset: 0,
          results: requestedRegion
            ? mapMonsterResults.filter((monster) => monster.location.region === requestedRegion)
            : mapMonsterResults
        })
      });
    }) as jest.Mock;

    await expect(fetchMapMonsterFamiliesByRegion("flaris")).resolves.toMatchObject([
      {
        family: "aibatt",
        location: { region: "flaris", x: 35, y: 70 },
        name: "Aibatt",
        questDrops: [{ id: 100, name: "Twinkle Stone", icon: "twinkle.png" }],
        variants: [
          { name: "Small Aibatt", variantRank: "small" },
          { icon: "aibatt.png", name: "Aibatt", variantRank: "normal" },
          { name: "Captain Aibatt", variantRank: "captain" },
          { name: "Giant Aibatt", variantRank: "giant" }
        ]
      }
    ]);

    await expect(fetchMapMonsterFamilyIndex()).resolves.toMatchObject({
      flaris: [{ family: "aibatt" }],
      saint: [{ family: "bang" }]
    });
    await expect(fetchMapMonsterFamilyIndex()).resolves.toMatchObject({
      flaris: [{ family: "aibatt" }],
      saint: [{ family: "bang" }]
    });

    const mapRequests = (global.fetch as jest.Mock).mock.calls.filter(([url]: [string]) =>
      new URL(url).pathname.endsWith("/api/data/mapMonsters")
    );
    expect(mapRequests).toHaveLength(2);
    expect(new URL(mapRequests[1][0]).searchParams.has("location.region")).toBe(false);
  });

  it("skips empty item icon requests and builds Flyff icon URLs", async () => {
    await expect(fetchItems("token", [])).resolves.toEqual([]);
    expect(global.fetch).not.toHaveBeenCalled();
    expect(getItemIconUrl("mkin04foot.png")).toBe("http://localhost:4000/api/images/item/mkin04foot.png");
    expect(getMonsterIconUrl("aibatt.png")).toBe("http://localhost:4000/api/images/monster/aibatt.png");
  });

  it("handles item and data loading failures", async () => {
    mockFetch({ ok: false });
    await expect(fetchItems("token", ["3497"])).rejects.toThrow("Unable to load item icons");

    mockFetch({ ok: false });
    await expect(fetchDataSet("items")).rejects.toThrow("Unable to load items data");

    mockFetch({
      ok: true,
      json: jest.fn().mockResolvedValue({ dataSet: "jobs", total: 0, limit: 50, offset: 0, results: [] })
    });
    await expect(fetchDataSet("jobs", { classId: undefined })).resolves.toEqual([]);
    expect(global.fetch).toHaveBeenCalledWith("http://localhost:4000/api/data/jobs");
  });

  it("calls admin inventory and refund endpoints with bearer tokens", async () => {
    const character = {
      id: "char-1",
      slotIndex: 0,
      name: "Hero",
      gender: "male",
      job: "Vagrant",
      progressionRank: "normal",
      level: 1,
      exp: 0,
      penya: 0,
      stats: { str: 15, sta: 15, dex: 15, int: 15 },
      skillLevels: {},
      equipment: {},
      inventory: { size: 50, items: [] }
    };

    mockFetch({ ok: true, json: jest.fn().mockResolvedValue({ character }) });

    await expect(refundCharacterStats("token", "char-1")).resolves.toEqual(character);
    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:4000/api/admin/characters/char-1/refund-stats",
      expect.objectContaining({
        method: "POST",
        headers: { Authorization: "Bearer token" }
      })
    );

    mockFetch({ ok: true, json: jest.fn().mockResolvedValue({ character }) });

    await expect(refundCharacterSkills("token", "char-1")).resolves.toEqual(character);
    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:4000/api/admin/characters/char-1/refund-skills",
      expect.objectContaining({ method: "POST" })
    );

    mockFetch({ ok: true, json: jest.fn().mockResolvedValue({ character: { ...character, penya: 2_500 } }) });

    await expect(addCharacterPenya("token", "char-1", 2_500)).resolves.toMatchObject({ penya: 2_500 });
    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:4000/api/admin/characters/char-1/penya",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ amount: 2_500 })
      })
    );

    mockFetch({ ok: true, json: jest.fn().mockResolvedValue({ character }) });

    await expect(
      addCharacterInventoryItem("token", "char-1", { itemId: "40", quantity: 2 })
    ).resolves.toEqual(character);
    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:4000/api/admin/characters/char-1/inventory",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ itemId: "40", quantity: 2 })
      })
    );
  });

  it("calls inventory equipment endpoints and surfaces API errors", async () => {
    const character = {
      id: "char-1",
      slotIndex: 0,
      name: "Hero",
      gender: "male",
      job: "Vagrant",
      progressionRank: "normal",
      level: 1,
      exp: 0,
      penya: 0,
      stats: { str: 15, sta: 15, dex: 15, int: 15 },
      skillLevels: {},
      equipment: {},
      inventory: { size: 50, items: [] }
    };

    mockFetch({ ok: true, json: jest.fn().mockResolvedValue({ character }) });

    await expect(equipInventoryItem("token", "char-1", 3)).resolves.toEqual(character);
    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:4000/api/characters/char-1/inventory/3/equip",
      expect.objectContaining({ method: "POST" })
    );

    mockFetch({ ok: true, json: jest.fn().mockResolvedValue({ character }) });

    await expect(moveInventoryItem("token", "char-1", 0, 4)).resolves.toEqual(character);
    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:4000/api/characters/char-1/inventory/move",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ fromSlotIndex: 0, toSlotIndex: 4 })
      })
    );

    mockFetch({ ok: true, json: jest.fn().mockResolvedValue({ character }) });

    await expect(sortInventory("token", "char-1", "name")).resolves.toEqual(character);
    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:4000/api/characters/char-1/inventory/sort",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ sortBy: "name" })
      })
    );

    mockFetch({ ok: true, json: jest.fn().mockResolvedValue({ character }) });

    await expect(unequipItem("token", "char-1", "cloak")).resolves.toEqual(character);
    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:4000/api/characters/char-1/equipment/cloak/unequip",
      expect.objectContaining({ method: "POST" })
    );

    mockFetch({
      ok: false,
      json: jest.fn().mockResolvedValue({ error: "Missing requirements:\nLevel: 75" })
    });
    await expect(equipInventoryItem("token", "char-1", 3)).rejects.toThrow(
      "Missing requirements:\nLevel: 75"
    );

    mockFetch({ ok: false, json: jest.fn().mockRejectedValue(new Error("bad json")) });
    await expect(moveInventoryItem("token", "char-1", 0, 4)).rejects.toThrow("Unable to move item");

    mockFetch({ ok: false, json: jest.fn().mockResolvedValue({ error: "Sort option is required" }) });
    await expect(sortInventory("token", "char-1", "name")).rejects.toThrow("Sort option is required");

    mockFetch({ ok: false, json: jest.fn().mockRejectedValue(new Error("bad json")) });
    await expect(sortInventory("token", "char-1", "name")).rejects.toThrow("Unable to sort inventory");

    mockFetch({ ok: false, json: jest.fn().mockResolvedValue({ error: "Equipment slot is empty" }) });
    await expect(unequipItem("token", "char-1", "cloak")).rejects.toThrow("Equipment slot is empty");

    mockFetch({ ok: false, json: jest.fn().mockRejectedValue(new Error("bad json")) });
    await expect(unequipItem("token", "char-1", "cloak")).rejects.toThrow("Unable to unequip item");
  });

  it("maps admin inventory and refund failures to UI messages", async () => {
    mockFetch({ ok: false, status: 403 });
    await expect(refundCharacterStats("token", "char-1")).rejects.toThrow("Admin access is required");

    mockFetch({ ok: false, status: 500 });
    await expect(refundCharacterSkills("token", "char-1")).rejects.toThrow("Unable to refund points");

    mockFetch({ ok: false, status: 403 });
    await expect(addCharacterInventoryItem("token", "char-1", { itemId: "40", quantity: 1 })).rejects.toThrow(
      "Admin access is required"
    );

    mockFetch({ ok: false, status: 404 });
    await expect(addCharacterInventoryItem("token", "char-1", { itemId: "40", quantity: 1 })).rejects.toThrow(
      "Item or character not found"
    );

    mockFetch({
      ok: false,
      status: 400,
      json: jest.fn().mockResolvedValue({ error: "Not enough inventory space" })
    });
    await expect(addCharacterInventoryItem("token", "char-1", { itemId: "40", quantity: 1 })).rejects.toThrow(
      "Not enough inventory space"
    );

    mockFetch({ ok: false, status: 500 });
    await expect(addCharacterInventoryItem("token", "char-1", { itemId: "40", quantity: 1 })).rejects.toThrow(
      "Unable to add item"
    );
  });
});
