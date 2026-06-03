import { characterRepository } from "../../src/data/characterRepository.js";
import { db } from "../../src/data/database.js";
import { userRepository } from "../../src/data/userRepository.js";
import { disconnectTestDatabase, resetTestDatabase } from "../setup/database.js";

describe("character repository", () => {
  beforeEach(async () => {
    await resetTestDatabase();
  });

  afterAll(async () => {
    await disconnectTestDatabase();
  });

  it("creates a vagrant with default stats and lists characters by player", () => {
    const user = userRepository.findByEmail("test@flyff-idle.local");

    expect(user).toBeDefined();

    const created = characterRepository.create({
      playerId: user!.id,
      slotIndex: 3,
      name: "Fresh Vagrant",
      gender: "female"
    });

    expect(created).toEqual(
      expect.objectContaining({
        name: "Fresh Vagrant",
        slotIndex: 3,
        gender: "female",
        job: "Vagrant",
        level: 1,
        exp: 0,
        penya: 0,
        stats: {
          str: 15,
          sta: 15,
          dex: 15,
          int: 15
        },
        inventory: {
          size: 50,
          items: []
        }
      })
    );

    expect(created?.playerId).toBe(user!.id);
    expect(characterRepository.listByPlayerId(user!.id).map((character) => character.name)).toEqual([
      "Saint Morning",
      "Buff Pang Jr",
      "Fresh Vagrant"
    ]);
  });

  it("returns inventory items ordered by slot", () => {
    const user = userRepository.findByEmail("test@flyff-idle.local");
    const character = characterRepository.create({
      playerId: user!.id,
      slotIndex: 4,
      name: "Collector",
      gender: "male"
    });
    const now = new Date().toISOString();

    db.prepare(
      "INSERT INTO character_inventory_items (id, character_id, slot_index, item_id, quantity, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).run("item-2", character!.id, 2, "food", 4, now, now);
    db.prepare(
      "INSERT INTO character_inventory_items (id, character_id, slot_index, item_id, quantity, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).run("item-1", character!.id, 1, "potion", 2, now, now);

    expect(characterRepository.findById(character!.id)?.inventory.items).toEqual([
      {
        slotIndex: 1,
        itemId: "potion",
        quantity: 2
      },
      {
        slotIndex: 2,
        itemId: "food",
        quantity: 4
      }
    ]);
  });

  it("handles empty lookups", () => {
    expect(characterRepository.listByIds([])).toEqual([]);
    expect(characterRepository.findById("missing")).toBeNull();
  });
});
