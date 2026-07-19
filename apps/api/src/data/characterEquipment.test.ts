import { characterRepository } from "./characterRepository.js";
import { db } from "./database.js";
import { userRepository } from "./userRepository.js";
import { disconnectTestDatabase, resetTestDatabase } from "../../tests/setup/database.js";

describe("characterEquipment", () => {
  beforeEach(async () => {
    await resetTestDatabase();
  });

  afterAll(async () => {
    await disconnectTestDatabase();
  });

  it("enforces equipment requirements and item equipability", () => {
    const user = userRepository.findByEmail("test@flyff-idle.local");
    const character = characterRepository.create({
      playerId: user!.id,
      slotIndex: 17,
      name: "EquipRules",
      gender: "female"
    });

    characterRepository.setInventoryItemForPlayer(character!.id, user!.id, {
      slotIndex: 3,
      itemId: "1",
      quantity: 1
    });
    characterRepository.setInventoryItemForPlayer(character!.id, user!.id, {
      slotIndex: 4,
      itemId: "42",
      quantity: 1
    });
    characterRepository.setInventoryItemForPlayer(character!.id, user!.id, {
      slotIndex: 5,
      itemId: "999999",
      quantity: 1
    });
    characterRepository.setInventoryItemForPlayer(character!.id, user!.id, {
      slotIndex: 6,
      itemId: "8507",
      quantity: 1
    });

    expect(characterRepository.equipInventoryItemForPlayer(character!.id, "other-player", 3)).toEqual({
      character: null,
      error: "Character not found"
    });
    expect(characterRepository.equipInventoryItemForPlayer(character!.id, user!.id, 5)).toEqual({
      character: null,
      error: "Item not found"
    });
    expect(characterRepository.equipInventoryItemForPlayer(character!.id, user!.id, 4)).toEqual({
      character: null,
      error: "That item cannot be equipped"
    });
    expect(characterRepository.equipInventoryItemForPlayer(character!.id, user!.id, 3).error).toContain(
      "Missing requirements"
    );

    db.prepare("UPDATE characters SET level = 15 WHERE id = ?").run(character!.id);
    const equippedFlyingItem = characterRepository.equipInventoryItemForPlayer(character!.id, user!.id, 6);

    expect(equippedFlyingItem.error).toBeNull();
    expect(equippedFlyingItem.character?.equipment).toEqual(
      expect.objectContaining({ flying: "8507", boots: "8195" })
    );
  });

  it("handles two-handed weapons, offhand blocking, paired slots, and full unequip inventory", () => {
    const user = userRepository.findByEmail("test@flyff-idle.local");
    const character = characterRepository.create({
      playerId: user!.id,
      slotIndex: 18,
      name: "GearSwitcher",
      gender: "male"
    });
    const now = new Date().toISOString();

    db.prepare("UPDATE characters SET level = ?, job = ?, offhand = ?, ring_l = ? WHERE id = ?").run(
      85,
      "Acrobat",
      "1855",
      "1764",
      character!.id
    );
    characterRepository.setInventoryItemForPlayer(character!.id, user!.id, {
      slotIndex: 3,
      itemId: "10",
      quantity: 1
    });

    const equippedTwoHander = characterRepository.equipInventoryItemForPlayer(character!.id, user!.id, 3);

    expect(equippedTwoHander.character?.equipment).toEqual(
      expect.objectContaining({
        mainhand: "10",
        offhand: null
      })
    );
    expect(equippedTwoHander.character?.inventory.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ itemId: "3497" }),
        expect.objectContaining({ itemId: "1855" })
      ])
    );

    characterRepository.setInventoryItemForPlayer(character!.id, user!.id, {
      slotIndex: 6,
      itemId: "1871",
      quantity: 1
    });

    expect(characterRepository.equipInventoryItemForPlayer(character!.id, user!.id, 6)).toEqual({
      character: null,
      error: "Unequip your two-handed weapon first"
    });

    characterRepository.setInventoryItemForPlayer(character!.id, user!.id, {
      slotIndex: 7,
      itemId: "5536",
      quantity: 1
    });

    expect(
      characterRepository.equipInventoryItemForPlayer(character!.id, user!.id, 7).character?.equipment
    ).toEqual(
      expect.objectContaining({
        ringL: "1764",
        ringR: "5536"
      })
    );

    db.prepare("DELETE FROM character_inventory_items WHERE character_id = ?").run(character!.id);
    const insertInventoryItem = db.prepare(
      "INSERT INTO character_inventory_items (id, character_id, slot_index, item_id, quantity, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
    );

    for (let slotIndex = 0; slotIndex < 50; slotIndex += 1) {
      insertInventoryItem.run(`full-${slotIndex}`, character!.id, slotIndex, "1855", 1, now, now);
    }

    expect(characterRepository.unequipItemForPlayer(character!.id, user!.id, "mainhand")).toEqual({
      character: null,
      error: "Inventory is full"
    });
  });

  it("equips Blade and Slayer one-handed weapons into the first empty hand", () => {
    const user = userRepository.findByEmail("test@flyff-idle.local");

    for (const [job, slotIndex] of [
      ["Blade", 19],
      ["Slayer", 20]
    ] as const) {
      const character = characterRepository.create({
        playerId: user!.id,
        slotIndex,
        name: `${job}DualWield`,
        gender: "male"
      });

      db.prepare("UPDATE characters SET level = ?, job = ?, mainhand = ?, offhand = ? WHERE id = ?").run(
        130,
        job,
        null,
        null,
        character!.id
      );

      characterRepository.setInventoryItemForPlayer(character!.id, user!.id, {
        slotIndex: 3,
        itemId: "3497",
        quantity: 1
      });

      expect(
        characterRepository.equipInventoryItemForPlayer(character!.id, user!.id, 3).character?.equipment
      ).toEqual(
        expect.objectContaining({
          mainhand: "3497",
          offhand: null
        })
      );

      characterRepository.setInventoryItemForPlayer(character!.id, user!.id, {
        slotIndex: 4,
        itemId: "3497",
        quantity: 1
      });

      expect(
        characterRepository.equipInventoryItemForPlayer(character!.id, user!.id, 4).character?.equipment
      ).toEqual(
        expect.objectContaining({
          mainhand: "3497",
          offhand: "3497"
        })
      );
    }
  });

  it("equips arrow stacks as ammo and consumes one per bow attack", () => {
    const user = userRepository.findByEmail("test@flyff-idle.local");
    const character = characterRepository.create({
      playerId: user!.id,
      slotIndex: 21,
      name: "BowAmmo",
      gender: "male"
    });
    db.prepare("UPDATE characters SET level = ?, job = ? WHERE id = ?").run(85, "Acrobat", character!.id);
    characterRepository.setInventoryItemForPlayer(character!.id, user!.id, {
      slotIndex: 3,
      itemId: "10",
      quantity: 1
    });
    characterRepository.setInventoryItemForPlayer(character!.id, user!.id, {
      slotIndex: 4,
      itemId: "4586",
      quantity: 3
    });

    characterRepository.equipInventoryItemForPlayer(character!.id, user!.id, 3);
    const equipped = characterRepository.equipInventoryItemForPlayer(character!.id, user!.id, 4);
    expect(equipped.character).toEqual(
      expect.objectContaining({
        ammoQuantity: 3,
        equipment: expect.objectContaining({ ammo: "4586", mainhand: "10" })
      })
    );

    expect(characterRepository.consumeEquippedArrowForPlayer(character!.id, user!.id).character).toEqual(
      expect.objectContaining({ ammoQuantity: 2 })
    );
    characterRepository.consumeEquippedArrowForPlayer(character!.id, user!.id);
    const finalArrow = characterRepository.consumeEquippedArrowForPlayer(character!.id, user!.id);
    expect(finalArrow.character).toEqual(
      expect.objectContaining({
        ammoQuantity: 0,
        equipment: expect.objectContaining({ ammo: null })
      })
    );
    expect(characterRepository.consumeEquippedArrowForPlayer(character!.id, user!.id)).toEqual({
      character: null,
      error: "Arrows must be equipped to attack with a bow"
    });
  });
});
