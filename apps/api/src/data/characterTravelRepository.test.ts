import { characterRepository } from "./characterRepository.js";
import { db } from "./database.js";
import { userRepository } from "./userRepository.js";
import { disconnectTestDatabase, resetTestDatabase } from "../../tests/setup/database.js";

describe("character travel repository", () => {
  beforeEach(async () => {
    await resetTestDatabase();
  });

  afterAll(async () => {
    await disconnectTestDatabase();
  });

  it("restricts travel by flying tier and consumes destination Blinkwings", () => {
    const user = userRepository.findByEmail("test@flyff-idle.local");
    const character = characterRepository.create({
      playerId: user!.id,
      slotIndex: 18,
      name: "Traveller",
      gender: "male"
    });

    db.prepare("UPDATE characters SET level = 15 WHERE id = ?").run(character!.id);
    characterRepository.setInventoryItemForPlayer(character!.id, user!.id, {
      slotIndex: 6,
      itemId: "8507",
      quantity: 1
    });
    characterRepository.equipInventoryItemForPlayer(character!.id, user!.id, 6);

    expect(characterRepository.travelForPlayer(character!.id, user!.id, "rhisis", "flying", 0)).toEqual(
      expect.objectContaining({
        error: null,
        character: expect.objectContaining({ location: "Rhisis" })
      })
    );
    expect(characterRepository.travelForPlayer(character!.id, user!.id, "darkon3", "flying", 0)).toEqual({
      character: null,
      error: "A tier 2 flying item is required"
    });
    expect(characterRepository.travelForPlayer(character!.id, user!.id, "darkon3", "blinkwing", 0)).toEqual({
      character: null,
      error: "Darkon 3 cannot be reached by Blinkwing"
    });

    characterRepository.setInventoryItemForPlayer(character!.id, user!.id, {
      slotIndex: 7,
      itemId: "4602",
      quantity: 2
    });
    const blinkwingTravel = characterRepository.travelForPlayer(
      character!.id,
      user!.id,
      "darkon12",
      "blinkwing",
      0
    );

    expect(blinkwingTravel.error).toBeNull();
    expect(blinkwingTravel.character).toEqual(
      expect.objectContaining({
        location: "Darkon 1 and 2",
        inventory: expect.objectContaining({
          items: expect.arrayContaining([{ slotIndex: 7, itemId: "4602", quantity: 1 }])
        })
      })
    );
  });
});
