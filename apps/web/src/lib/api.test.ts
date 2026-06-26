import {
  createCharacter,
  deleteCharacter,
  addCharacterInventoryItem,
  equipInventoryItem,
  fetchCharacters,
  fetchDataSet,
  fetchItems,
  getItemIconUrl,
  login,
  moveInventoryItem,
  register,
  refundCharacterSkills,
  refundCharacterStats,
  sortInventory,
  unequipItem,
  updateCharacterProgression
} from "./api";

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
    mockFetch({ ok: false, status: 401 });
    await expect(login("pilot@example.com", "bad-password")).rejects.toThrow("Invalid email or password");

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
        stats: { str: 16, sta: 15, dex: 15, int: 15 },
        skillLevels: { "vagrant-clean-hit": 1 }
      })
    ).resolves.toEqual({ ...character, stats: { str: 16, sta: 15, dex: 15, int: 15 } });
    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:4000/api/characters/char-1/progression",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({
          stats: { str: 16, sta: 15, dex: 15, int: 15 },
          skillLevels: { "vagrant-clean-hit": 1 }
        })
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

  it("skips empty item icon requests and builds Flyff icon URLs", async () => {
    await expect(fetchItems("token", [])).resolves.toEqual([]);
    expect(global.fetch).not.toHaveBeenCalled();
    expect(getItemIconUrl("mkin04foot.png")).toBe("https://api.flyff.com/image/item/mkin04foot.png");
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

    mockFetch({ ok: false, status: 500 });
    await expect(addCharacterInventoryItem("token", "char-1", { itemId: "40", quantity: 1 })).rejects.toThrow(
      "Unable to add item"
    );
  });
});
