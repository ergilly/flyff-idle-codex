import { db } from "../data/database.js";
import { characterRepository } from "../data/characterRepository.js";
import { userRepository } from "../data/userRepository.js";
import { disconnectTestDatabase, resetTestDatabase } from "../../tests/setup/database.js";
import { allocateSkills, allocateStats } from "./characterProgression.service.js";

describe("character progression service", () => {
  beforeEach(async () => resetTestDatabase());
  afterAll(async () => disconnectTestDatabase());

  it("allocates stats without allowing the available point budget to be exceeded", () => {
    const user = userRepository.findByEmail("test@flyff-idle.local")!;
    const character = characterRepository.create({
      playerId: user.id,
      slotIndex: 30,
      name: "Stat Rules",
      gender: "male"
    })!;
    db.prepare("UPDATE characters SET level = 2 WHERE id = ?").run(character.id);

    expect(allocateStats(character.id, user.id, { str: 2, sta: 0, dex: 0, int: 0 }).character?.stats).toEqual(
      {
        str: 17,
        sta: 15,
        dex: 15,
        int: 15
      }
    );
    expect(allocateStats(character.id, user.id, { str: 1, sta: 0, dex: 0, int: 0 })).toEqual({
      character: null,
      error: "Not enough stat points"
    });
  });

  it("validates skill metadata, job eligibility, maximum levels, and ownership", () => {
    const user = userRepository.findByEmail("test@flyff-idle.local")!;
    const character = characterRepository.create({
      playerId: user.id,
      slotIndex: 31,
      name: "Skill Rules",
      gender: "male"
    })!;
    db.prepare("UPDATE characters SET level = 15, job = 'Mercenary' WHERE id = ?").run(character.id);

    expect(allocateSkills(character.id, user.id, { "226": 1 }).character?.skillLevels).toEqual({ "226": 1 });
    expect(allocateSkills(character.id, user.id, { "226": 1 }).error).toBe(
      "The skill is already at its maximum level"
    );
    expect(allocateSkills(character.id, user.id, { "999999": 1 }).error).toBe("Skill 999999 was not found");
    expect(allocateSkills(character.id, "other-player", { "226": 1 }).error).toBe("Character not found");
  });
});
