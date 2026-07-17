import { characterRepository } from "./characterRepository.js";
import { userRepository } from "./userRepository.js";
import { disconnectTestDatabase, resetTestDatabase } from "../../tests/setup/database.js";

describe("character core repository", () => {
  beforeEach(async () => {
    await resetTestDatabase();
  });

  afterAll(async () => {
    await disconnectTestDatabase();
  });

  it("creates, lists, and deletes a character for its player", async () => {
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
        location: "Flaris",
        level: 1,
        penya: 0,
        stats: { str: 15, sta: 15, dex: 15, int: 15 }
      })
    );
    expect(characterRepository.listByPlayerId(user!.id)).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: created!.id })])
    );

    expect(await characterRepository.deleteByIdForPlayer(created!.id, user!.id)).toBe(true);
    expect(characterRepository.findById(created!.id)).toBeNull();
  });

  it("does not expose missing characters or delete another player's character", async () => {
    const user = userRepository.findByEmail("test@flyff-idle.local")!;
    const otherUser = userRepository.create({
      email: "other@flyff-idle.local",
      displayName: "Other Player",
      passwordHash: "hash"
    });
    const character = characterRepository.create({
      playerId: user.id,
      slotIndex: 8,
      name: "Owned Character",
      gender: "male"
    })!;

    expect(characterRepository.findById("missing")).toBeNull();
    expect(await characterRepository.deleteByIdForPlayer(character.id, otherUser.id)).toBe(false);
    expect(characterRepository.findById(character.id)).not.toBeNull();
  });
});
