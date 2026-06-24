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
      slotIndex: 8,
      name: "Fresh Vagrant",
      gender: "female"
    });

    expect(created).toEqual(
      expect.objectContaining({
        name: "Fresh Vagrant",
        slotIndex: 8,
        gender: "female",
        job: "Vagrant",
        progressionRank: "normal",
        level: 1,
        exp: 0,
        penya: 0,
        stats: {
          str: 15,
          sta: 15,
          dex: 15,
          int: 15
        },
        skillLevels: {},
        equipment: expect.objectContaining({
          mainhand: "3497",
          suit: "6040",
          gloves: "5011",
          boots: "8195"
        }),
        inventory: {
          size: 50,
          items: [
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
            }
          ]
        }
      })
    );

    expect(created?.playerId).toBe(user!.id);
    expect(characterRepository.listByPlayerId(user!.id).map((character) => character.name)).toEqual([
      "Fresh Vagrant",
      "Saint Morning",
      "Buff Pang Jr",
      "Madrigal Mage",
      "Darkon Archer",
      "Clockworks Blade",
      "Master Guardian",
      "Hero Seraph",
      "Fresh Vagrant"
    ]);
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

  it("updates persisted stats and skill levels for the owning player", () => {
    const user = userRepository.findByEmail("test@flyff-idle.local");
    const character = characterRepository.create({
      playerId: user!.id,
      slotIndex: 11,
      name: "Builder",
      gender: "male"
    });

    const updated = characterRepository.updateProgressionForPlayer(character!.id, user!.id, {
      stats: {
        str: 18,
        sta: 17,
        dex: 15,
        int: 15
      },
      skillLevels: {
        "vagrant-clean-hit": 3,
        "vagrant-brandish": 1
      }
    });

    expect(updated).toEqual(
      expect.objectContaining({
        stats: {
          str: 18,
          sta: 17,
          dex: 15,
          int: 15
        },
        skillLevels: {
          "vagrant-clean-hit": 3,
          "vagrant-brandish": 1
        }
      })
    );
    expect(
      characterRepository.updateProgressionForPlayer(character!.id, "other-player", { skillLevels: {} })
    ).toBeNull();
    expect(characterRepository.findById(character!.id)?.skillLevels).toEqual({
      "vagrant-clean-hit": 3,
      "vagrant-brandish": 1
    });
  });

  it("refunds stats and skills independently for the owning player", () => {
    const user = userRepository.findByEmail("test@flyff-idle.local");
    const character = characterRepository.create({
      playerId: user!.id,
      slotIndex: 12,
      name: "RefundHero",
      gender: "male"
    });

    characterRepository.updateProgressionForPlayer(character!.id, user!.id, {
      stats: {
        str: 22,
        sta: 18,
        dex: 17,
        int: 16
      },
      skillLevels: {
        "vagrant-clean-hit": 3,
        "vagrant-brandish": 1
      }
    });

    expect(characterRepository.refundStatsForPlayer(character!.id, user!.id)).toEqual(
      expect.objectContaining({
        stats: {
          str: 15,
          sta: 15,
          dex: 15,
          int: 15
        },
        skillLevels: {
          "vagrant-clean-hit": 3,
          "vagrant-brandish": 1
        }
      })
    );
    expect(characterRepository.refundStatsForPlayer(character!.id, "other-player")).toBeNull();

    expect(characterRepository.refundSkillsForPlayer(character!.id, user!.id)).toEqual(
      expect.objectContaining({
        stats: {
          str: 15,
          sta: 15,
          dex: 15,
          int: 15
        },
        skillLevels: {}
      })
    );
    expect(characterRepository.refundSkillsForPlayer(character!.id, "other-player")).toBeNull();
  });

  it("deletes characters by id and player", () => {
    const user = userRepository.findByEmail("test@flyff-idle.local");
    const character = characterRepository.create({
      playerId: user!.id,
      slotIndex: 10,
      name: "Delete Me",
      gender: "female"
    });

    expect(characterRepository.deleteByIdForPlayer(character!.id, "other-player")).toBe(false);
    expect(characterRepository.findById(character!.id)).not.toBeNull();

    expect(characterRepository.deleteByIdForPlayer(character!.id, user!.id)).toBe(true);
    expect(characterRepository.findById(character!.id)).toBeNull();
  });

  it("handles empty lookups", () => {
    expect(characterRepository.listByIds([])).toEqual([]);
    expect(characterRepository.findById("missing")).toBeNull();
  });
});
