import { characterRepository } from "./characterRepository.js";
import { db } from "./database.js";
import { userRepository } from "./userRepository.js";
import { disconnectTestDatabase, resetTestDatabase } from "../../tests/setup/database.js";

describe("characterInventoryStorage", () => {
  beforeEach(async () => {
    await resetTestDatabase();
  });

  afterAll(async () => {
    await disconnectTestDatabase();
  });

  it("adds stackable items to existing stacks before using new slots", () => {
    const user = userRepository.findByEmail("test@flyff-idle.local");
    const character = characterRepository.create({
      playerId: user!.id,
      slotIndex: 13,
      name: "Stacker",
      gender: "male"
    });
    const now = new Date().toISOString();

    db.prepare(
      "UPDATE character_inventory_items SET quantity = ?, updated_at = ? WHERE character_id = ? AND slot_index = ?"
    ).run(9998, now, character!.id, 0);

    const updated = characterRepository.setInventoryItemForPlayer(character!.id, user!.id, {
      itemId: "5325",
      quantity: 3
    });

    expect(updated?.inventory.items).toEqual(
      expect.arrayContaining([
        { slotIndex: 0, itemId: "5325", quantity: 9999 },
        { slotIndex: 3, itemId: "5325", quantity: 2 }
      ])
    );
  });

  it("adds looted inventory item batches for the owning player", () => {
    const user = userRepository.findByEmail("test@flyff-idle.local");
    const character = characterRepository.create({
      playerId: user!.id,
      slotIndex: 15,
      name: "Looter",
      gender: "male"
    });

    const result = characterRepository.addInventoryItemsForPlayer(character!.id, user!.id, [
      { itemId: "5325", quantity: 2 }
    ]);

    expect(result.character?.inventory.items).toEqual(
      expect.arrayContaining([{ slotIndex: 0, itemId: "5325", quantity: 5 }])
    );
    expect(characterRepository.addInventoryItemsForPlayer(character!.id, "other-player", [])).toEqual({
      character: null,
      error: "Character not found"
    });
  });

  it("updates fixed inventory slots and rejects oversized additions", () => {
    const user = userRepository.findByEmail("test@flyff-idle.local");
    const character = characterRepository.create({
      playerId: user!.id,
      slotIndex: 13,
      name: "Slotter",
      gender: "male"
    });

    const replaced = characterRepository.setInventoryItemForPlayer(character!.id, user!.id, {
      slotIndex: 1,
      itemId: "1855",
      quantity: 1
    });

    expect(replaced?.inventory.items).toEqual(
      expect.arrayContaining([{ slotIndex: 1, itemId: "1855", quantity: 1 }])
    );

    const inserted = characterRepository.setInventoryItemForPlayer(character!.id, user!.id, {
      slotIndex: 6,
      itemId: "1871",
      quantity: 1
    });

    expect(inserted?.inventory.items).toEqual(
      expect.arrayContaining([{ slotIndex: 6, itemId: "1871", quantity: 1 }])
    );

    expect(
      characterRepository.setInventoryItemForPlayer(character!.id, user!.id, {
        itemId: "1855",
        quantity: 48
      })
    ).toBeNull();
    expect(
      characterRepository.setInventoryItemForPlayer(character!.id, "other-player", {
        slotIndex: 3,
        itemId: "1855",
        quantity: 1
      })
    ).toBeNull();
  });

  it("does not let inventory writes exceed the character capacity", () => {
    const user = userRepository.findByEmail("test@flyff-idle.local");
    const character = characterRepository.create({
      playerId: user!.id,
      slotIndex: 16,
      name: "Capacity",
      gender: "male"
    });

    expect(
      characterRepository.setInventoryItemForPlayer(character!.id, user!.id, {
        slotIndex: 55,
        itemId: "5325",
        quantity: 1
      })
    ).toBeNull();

    const moveResult = characterRepository.moveInventoryItemForPlayer(character!.id, user!.id, 0, 55);

    expect(moveResult).toEqual({
      character: null,
      error: "Destination slot is outside inventory capacity"
    });
    expect(characterRepository.findById(character!.id)?.inventory).toMatchObject({
      size: 50,
      items: expect.not.arrayContaining([expect.objectContaining({ slotIndex: 55 })])
    });
  });
});
