import { characterRepository } from "./characterRepository.js";
import { db } from "./database.js";
import { userRepository } from "./userRepository.js";
import { disconnectTestDatabase, resetTestDatabase } from "../../tests/setup/database.js";

describe("characterConsumables", () => {
  beforeEach(async () => {
    await resetTestDatabase();
  });

  afterAll(async () => {
    await disconnectTestDatabase();
  });

  it("persists equipped consumables by resource for the owning player", () => {
    const user = userRepository.findByEmail("test@flyff-idle.local");
    const character = characterRepository.create({
      playerId: user!.id,
      slotIndex: 10,
      name: "Food Picker",
      gender: "male"
    });

    characterRepository.setInventoryItemForPlayer(character!.id, user!.id, {
      slotIndex: 3,
      itemId: "5325",
      quantity: 2
    });

    const equipped = characterRepository.equipConsumableItemForPlayer(character!.id, user!.id, "hp", 3);

    expect(equipped.character?.consumableLoadout).toEqual({
      fp: null,
      hp: { itemId: "5325", quantity: 2 },
      mp: null
    });
    expect(characterRepository.findById(character!.id)?.inventory.items).not.toEqual(
      expect.arrayContaining([{ slotIndex: 3, itemId: "5325", quantity: 2 }])
    );
    expect(characterRepository.findById(character!.id)?.consumableLoadout.hp).toEqual({
      itemId: "5325",
      quantity: 2
    });
    expect(
      characterRepository.consumeEquippedConsumableForPlayer(character!.id, user!.id, "hp").character
        ?.consumableLoadout.hp
    ).toEqual({ itemId: "5325", quantity: 1 });
    characterRepository.setInventoryItemForPlayer(character!.id, user!.id, {
      slotIndex: 4,
      itemId: "5325",
      quantity: 2
    });
    const stacked = characterRepository.equipConsumableItemForPlayer(character!.id, user!.id, "hp", 4);
    expect(stacked.character?.consumableLoadout.hp).toEqual({ itemId: "5325", quantity: 3 });
    expect(stacked.character?.inventory.items).not.toEqual(
      expect.arrayContaining([{ slotIndex: 4, itemId: "5325", quantity: 2 }])
    );
    expect(characterRepository.equipConsumableItemForPlayer(character!.id, user!.id, "mp", 99)).toEqual({
      character: null,
      error: "Inventory item not found"
    });
    expect(characterRepository.equipConsumableItemForPlayer(character!.id, "other-player", "hp", 3)).toEqual({
      character: null,
      error: "Character not found"
    });
  });

  it("stacks looted matching consumables into equipped consumable slots before inventory", () => {
    const user = userRepository.findByEmail("test@flyff-idle.local");
    const character = characterRepository.create({
      playerId: user!.id,
      slotIndex: 11,
      name: "Snack Stack",
      gender: "male"
    });

    db.prepare("UPDATE characters SET consumable_loadout = ?, updated_at = ? WHERE id = ?").run(
      JSON.stringify({
        fp: null,
        hp: { itemId: "5325", quantity: 2 },
        mp: null
      }),
      new Date().toISOString(),
      character!.id
    );

    const result = characterRepository.addInventoryItemsForPlayer(character!.id, user!.id, [
      { itemId: "5325", quantity: 3 }
    ]);

    expect(result.character?.consumableLoadout.hp).toEqual({ itemId: "5325", quantity: 5 });
    expect(
      result.character?.inventory.items
        .filter((item) => item.itemId === "5325")
        .reduce((total, item) => total + item.quantity, 0)
    ).toBe(3);
  });
});
