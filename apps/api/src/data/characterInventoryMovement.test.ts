import { characterRepository } from "./characterRepository.js";
import { db } from "./database.js";
import { userRepository } from "./userRepository.js";
import { disconnectTestDatabase, resetTestDatabase } from "../../tests/setup/database.js";

describe("characterInventoryMovement", () => {
  beforeEach(async () => {
    await resetTestDatabase();
  });

  afterAll(async () => {
    await disconnectTestDatabase();
  });

  it("returns inventory items ordered by slot", () => {
    const user = userRepository.findByEmail("test@flyff-idle.local");
    const character = characterRepository.create({
      playerId: user!.id,
      slotIndex: 9,
      name: "Collector",
      gender: "male"
    });
    const now = new Date().toISOString();

    expect(character?.equipment).toEqual(
      expect.objectContaining({
        mainhand: "3497",
        suit: "3314",
        gloves: "5535",
        boots: "4750"
      })
    );

    db.prepare(
      "INSERT INTO character_inventory_items (id, character_id, slot_index, item_id, quantity, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).run("item-4", character!.id, 4, "food", 4, now, now);
    db.prepare(
      "INSERT INTO character_inventory_items (id, character_id, slot_index, item_id, quantity, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).run("item-3", character!.id, 3, "potion", 2, now, now);

    expect(characterRepository.findById(character!.id)?.inventory.items).toEqual([
      {
        slotIndex: 0,
        itemId: "5325",
        quantity: 3
      },
      {
        slotIndex: 1,
        itemId: "9449",
        quantity: 1
      },
      {
        slotIndex: 2,
        itemId: "3896",
        quantity: 5
      },
      {
        slotIndex: 3,
        itemId: "potion",
        quantity: 2
      },
      {
        slotIndex: 4,
        itemId: "food",
        quantity: 4
      }
    ]);
  });

  it("moves inventory items into empty slots, merges matching stacks, and swaps different items", () => {
    const user = userRepository.findByEmail("test@flyff-idle.local");
    const character = characterRepository.create({
      playerId: user!.id,
      slotIndex: 14,
      name: "Mover",
      gender: "male"
    });

    characterRepository.setInventoryItemForPlayer(character!.id, user!.id, {
      slotIndex: 5,
      itemId: "5325",
      quantity: 2
    });

    const merged = characterRepository.moveInventoryItemForPlayer(character!.id, user!.id, 0, 5).character;

    expect(merged?.inventory.items).toEqual(
      expect.arrayContaining([{ slotIndex: 5, itemId: "5325", quantity: 5 }])
    );
    expect(merged?.inventory.items.some((item) => item.slotIndex === 0)).toBe(false);

    const moved = characterRepository.moveInventoryItemForPlayer(character!.id, user!.id, 5, 6).character;

    expect(moved?.inventory.items).toEqual(
      expect.arrayContaining([{ slotIndex: 6, itemId: "5325", quantity: 5 }])
    );

    const swapped = characterRepository.moveInventoryItemForPlayer(character!.id, user!.id, 1, 2).character;

    expect(swapped?.inventory.items).toEqual(
      expect.arrayContaining([
        { slotIndex: 1, itemId: "3896", quantity: 5 },
        { slotIndex: 2, itemId: "9449", quantity: 1 }
      ])
    );
    expect(swapped?.inventory.size).toBe(50);
  });

  it("handles no-op and missing-character inventory moves", () => {
    const user = userRepository.findByEmail("test@flyff-idle.local");
    const character = characterRepository.create({
      playerId: user!.id,
      slotIndex: 14,
      name: "StillMover",
      gender: "female"
    });

    expect(characterRepository.moveInventoryItemForPlayer(character!.id, user!.id, 0, 0)).toEqual({
      character,
      error: null
    });
    expect(characterRepository.moveInventoryItemForPlayer(character!.id, "other-player", 0, 1)).toEqual({
      character: null,
      error: "Character not found"
    });
    expect(characterRepository.moveInventoryItemForPlayer("missing", user!.id, 0, 1)).toEqual({
      character: null,
      error: "Character not found"
    });
    expect(characterRepository.moveInventoryItemForPlayer(character!.id, user!.id, 40, 1)).toEqual({
      character: null,
      error: "Inventory item not found"
    });
  });

  it("sorts inventory into dense slots by the selected item field", () => {
    const user = userRepository.findByEmail("test@flyff-idle.local");
    const character = characterRepository.create({
      playerId: user!.id,
      slotIndex: 15,
      name: "Sorter",
      gender: "male"
    });

    const updated = characterRepository.sortInventoryForPlayer(character!.id, user!.id, "name");

    expect(updated?.inventory.items).toEqual([
      { slotIndex: 0, itemId: "9449", quantity: 1 },
      { slotIndex: 1, itemId: "5325", quantity: 3 },
      { slotIndex: 2, itemId: "3896", quantity: 5 }
    ]);
  });

  it("sorts by numeric, class, and category metadata", () => {
    const user = userRepository.findByEmail("test@flyff-idle.local");
    const character = characterRepository.create({
      playerId: user!.id,
      slotIndex: 15,
      name: "SorterTwo",
      gender: "male"
    });

    characterRepository.setInventoryItemForPlayer(character!.id, user!.id, {
      slotIndex: 3,
      itemId: "1855",
      quantity: 1
    });

    expect(
      characterRepository.sortInventoryForPlayer(character!.id, user!.id, "level")?.inventory.items
    ).toHaveLength(4);
    expect(
      characterRepository.sortInventoryForPlayer(character!.id, user!.id, "job")?.inventory.items
    ).toHaveLength(4);
    expect(
      characterRepository.sortInventoryForPlayer(character!.id, user!.id, "category")?.inventory.items
    ).toEqual(expect.arrayContaining([{ slotIndex: 0, itemId: "1855", quantity: 1 }]));
    expect(characterRepository.sortInventoryForPlayer(character!.id, "other-player", "name")).toBeNull();
  });
});
